export declare function templateVariableNames(body: string): string[];
export declare class TemplateRenderError extends Error {
}
export declare function renderTemplate(body: string, vars?: Record<string, string>): string;
export declare function renderedLength(body: string, vars?: Record<string, string>): number;
