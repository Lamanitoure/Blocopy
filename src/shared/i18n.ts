// Thin localization wrapper over browser.i18n.getMessage (Spec Section 11.1)

export type Substitutions = string | readonly string[];

// Fetches message from WebExtension browser.i18n API if available
function queryBrowserI18n(key: string, substitutions?: Substitutions): string | undefined {
  if (typeof browser === 'undefined') {
    return undefined;
  }

  const rawSubs = typeof substitutions === 'string'
    ? substitutions
    : substitutions ? [...substitutions] : undefined;

  const msg = browser.i18n.getMessage(key, rawSubs);
  return msg.length > 0 ? msg : undefined;
}

// Translates a message key using browser.i18n with strict test failure for missing keys
export function t(key: string, substitutions?: Substitutions): string {
  const resolved = queryBrowserI18n(key, substitutions);
  if (resolved !== undefined) {
    return resolved;
  }

  if (key === '@@bidi_dir') {
    return 'ltr';
  }

  if (typeof process !== 'undefined' && process.env['NODE_ENV'] === 'test') {
    throw new Error(`Missing translation key: "${key}"`);
  }

  return key;
}
