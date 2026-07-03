export interface PromptTemplate {
  id: string;
  version: string;
  template: string;
  variables: string[];
}

export class PromptRegistry {
  private prompts = new Map<string, PromptTemplate>();

  register(prompt: PromptTemplate): void {
    this.prompts.set(`${prompt.id}@${prompt.version}`, prompt);
  }

  get(id: string, version: string): PromptTemplate {
    const prompt = this.prompts.get(`${id}@${version}`);
    if (!prompt) {
      throw new Error(`Prompt '${id}@${version}' not found`);
    }
    return prompt;
  }

  render(prompt: PromptTemplate, variables: Record<string, string>): string {
    return prompt.variables.reduce((rendered, variable) => {
      return rendered.replaceAll(`{{${variable}}}`, variables[variable] ?? "");
    }, prompt.template);
  }
}
