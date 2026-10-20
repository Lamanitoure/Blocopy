declare module '*/translate-locales.mjs' {
  export interface SplitPart {
    readonly type: 'text' | 'placeholder';
    readonly value: string;
  }

  export function splitPlaceholders(text: string): SplitPart[];

  export function mergeOverrides<T extends Record<string, unknown>>(
    generated: T,
    overrides: Record<string, unknown>
  ): T & Record<string, unknown>;
}
