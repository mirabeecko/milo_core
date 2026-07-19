/**
 * PUT /api/agents/[slug]/definition
 *
 * Zapíše změny do definičního souboru agenta v packages/agents/src/registry/<file>.ts
 *
 * Body: { name?, description?, systemPrompt?, model?, temperature?, tools?, priority?, role?, specialization? }
 *
 * Pracuje s TypeScript soubory jako s textem — hledá export const <name>Definition: AgentDefinition = { ... }
 * a přepisuje jednotlivá pole uvnitř toho objektu.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { NextResponse } from "next/server";
import {
  AGENT_DEFINITION_FILES,
  EDITABLE_FIELDS,
  type DefinitionUpdate,
} from "@/lib/agent-definition-files";

const REGISTRY_DIR = resolve(process.cwd(), "../../packages/agents/src/registry");

function findDefinitionObject(source: string): { start: number; end: number } | null {
  // Najdi export const <name>Definition: AgentDefinition = {
  const match = source.match(/export const (\w+): AgentDefinition = \{/);
  if (!match) return null;

  const objStart = match.index! + match[0].length - 1; // pozice otevírací {
  let depth = 1;
  let pos = objStart + 1;

  // Najdi odpovídající zavírací }
  while (pos < source.length && depth > 0) {
    if (source[pos] === "{" && !isInString(source, pos)) depth++;
    else if (source[pos] === "}" && !isInString(source, pos)) depth--;
    pos++;
  }

  return { start: objStart, end: pos };
}

function isInString(source: string, pos: number): boolean {
  let inString = false;
  let stringChar = "";
  for (let i = 0; i < pos; i++) {
    if (!inString) {
      if (source[i] === '"' || source[i] === "'" || source[i] === "`") {
        inString = true;
        stringChar = source[i];
      }
    } else {
      if (source[i] === "\\") {
        i++; // skip escaped char
      } else if (source[i] === stringChar) {
        inString = false;
      }
    }
  }
  return inString;
}

function updateStringField(
  source: string,
  objStart: number,
  objEnd: number,
  fieldName: string,
  newValue: string,
  useTemplateLiteral: boolean = false,
): string {
  const obj = source.slice(objStart, objEnd);

  // Najdi existující pole
  const fieldRegex = new RegExp(`(${fieldName})\\s*:\\s*(["'\`])([\\s\\S]*?)\\2`, "m");
  const match = fieldRegex.exec(obj);

  if (match) {
    const quote = useTemplateLiteral ? "`" : '"';
    const escaped = useTemplateLiteral
      ? newValue
      : newValue.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const replacement = `${fieldName}: ${quote}${escaped}${quote}`;
    const newObj = obj.slice(0, match.index) + replacement + obj.slice(match.index + match[0].length);
    return source.slice(0, objStart) + newObj + source.slice(objEnd);
  }

  // Pole neexistuje — přidej na začátek objektu
  const quote = useTemplateLiteral ? "`" : '"';
  const newLine = `\n  ${fieldName}: ${quote}${newValue}${quote},`;
  return source.slice(0, objStart + 1) + newLine + source.slice(objStart + 1);
}

function updateNumericField(
  source: string,
  objStart: number,
  objEnd: number,
  fieldName: string,
  newValue: number,
): string {
  const obj = source.slice(objStart, objEnd);
  const fieldRegex = new RegExp(`(${fieldName})\\s*:\\s*([\\d.]+)`, "m");
  const match = fieldRegex.exec(obj);

  if (match) {
    const replacement = `${fieldName}: ${newValue}`;
    const newObj = obj.slice(0, match.index) + replacement + obj.slice(match.index + match[0].length);
    return source.slice(0, objStart) + newObj + source.slice(objEnd);
  }

  const newLine = `\n  ${fieldName}: ${newValue},`;
  return source.slice(0, objStart + 1) + newLine + source.slice(objStart + 1);
}

function updateArrayField(
  source: string,
  objStart: number,
  objEnd: number,
  fieldName: string,
  newValues: string[],
): string {
  const obj = source.slice(objStart, objEnd);
  const arrayStr = JSON.stringify(newValues);
  // Najdi existující pole (libovolné pole)
  const fieldRegex = new RegExp(`${fieldName}\\s*:\\s*\\[[^\\]]*\\]`, "m");
  const match = fieldRegex.exec(obj);

  if (match) {
    const replacement = `${fieldName}: ${arrayStr}`;
    const newObj = obj.slice(0, match.index) + replacement + obj.slice(match.index + match[0].length);
    return source.slice(0, objStart) + newObj + source.slice(objEnd);
  }

  const newLine = `\n  ${fieldName}: ${arrayStr},`;
  return source.slice(0, objStart + 1) + newLine + source.slice(objStart + 1);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const body: DefinitionUpdate = await req.json();

    const fileName = AGENT_DEFINITION_FILES[slug];
    if (!fileName) {
      return NextResponse.json(
        { error: `Neznámý agent: ${slug}. Dostupné: ${Object.keys(AGENT_DEFINITION_FILES).join(", ")}` },
        { status: 404 },
      );
    }

    const filePath = resolve(REGISTRY_DIR, fileName);

    let source: string;
    try {
      source = readFileSync(filePath, "utf-8");
    } catch {
      return NextResponse.json(
        { error: `Soubor ${filePath} neexistuje` },
        { status: 404 },
      );
    }

    const def = findDefinitionObject(source);
    if (!def) {
      return NextResponse.json(
        { error: `V souboru ${fileName} nebyl nalezen AgentDefinition export` },
        { status: 500 },
      );
    }

    let modified = false;

    // String fields (top-level)
    for (const field of ["name", "description", "role", "specialization", "priority"] as const) {
      const val = body[field as keyof DefinitionUpdate];
      if (val !== undefined && typeof val === "string") {
        source = updateStringField(source, def.start, def.end, field, val);
        modified = true;
      }
    }

    // systemPrompt — template literal
    if (body.systemPrompt !== undefined) {
      source = updateStringField(source, def.start, def.end, "systemPrompt", body.systemPrompt, true);
      modified = true;
    }

    // model — string, ale uvnitř config objektu
    if (body.model !== undefined) {
      source = updateStringField(source, def.start, def.end, "model", body.model);
      modified = true;
    }

    // temperature — number, uvnitř config
    if (body.temperature !== undefined) {
      source = updateNumericField(source, def.start, def.end, "temperature", body.temperature);
      modified = true;
    }

    // tools — array, uvnitř config
    if (body.tools !== undefined && Array.isArray(body.tools)) {
      source = updateArrayField(source, def.start, def.end, "tools", body.tools);
      modified = true;
    }

    // knowledge — array, uvnitř config
    if (body.knowledge !== undefined && Array.isArray(body.knowledge)) {
      source = updateArrayField(source, def.start, def.end, "knowledge", body.knowledge);
      modified = true;
    }

    if (!modified) {
      return NextResponse.json(
        { error: "Žádná platná pole k aktualizaci" },
        { status: 400 },
      );
    }

    writeFileSync(filePath, source);

    return NextResponse.json({
      ok: true,
      slug,
      file: fileName,
      path: filePath,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
