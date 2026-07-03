import { ToolRegistry } from "./index.js";
import { registerFilesystemTools } from "../providers/filesystem/index.js";
import { registerShellTools } from "../providers/shell/index.js";
import { registerWebSearchTools } from "../providers/web-search/index.js";
import { registerGitHubTools } from "../providers/github/index.js";
import { registerObsidianTools } from "../providers/obsidian/tools/index.js";

export function createDefaultToolRegistry(): ToolRegistry {
  const registry = new ToolRegistry();
  registerFilesystemTools(registry);
  registerShellTools(registry);
  registerWebSearchTools(registry);
  registerGitHubTools(registry);
  registerObsidianTools(registry);
  return registry;
}
