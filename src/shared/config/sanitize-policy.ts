// HTML element tags allowed in sanitized clipboard output
export const ALLOWED_TAGS = [
  'a', 'abbr', 'b', 'blockquote', 'br', 'code', 'dd', 'del', 'div', 'dl', 'dt',
  'em', 'figcaption', 'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i',
  'img', 'ins', 'kbd', 'li', 'mark', 'ol', 'p', 'pre', 'q', 's', 'small', 'span',
  'strong', 'sub', 'sup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'u', 'ul',
] as const;

// Specific attributes permitted per allowed HTML element tag
export const ALLOWED_ATTRIBUTES: Readonly<Record<string, readonly string[]>> = {
  a: ['href', 'title'],
  img: ['src', 'alt', 'width', 'height'],
  td: ['colspan', 'rowspan'],
  th: ['colspan', 'rowspan', 'scope'],
  ol: ['start'],
} as const;

// Allowed protocols for href attributes
export const ALLOWED_URL_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'] as const;

// Allowed protocols for img src attributes
export const ALLOWED_IMG_PROTOCOLS = ['http:', 'https:'] as const;

// Elements and subtree selectors that must be completely dropped with their contents
export const DROP_WITH_CONTENT_SELECTOR = 'script, style, noscript, template, iframe, object, embed, svg, math, form, input, button, select, textarea, link, meta, base, canvas, audio, video, [hidden], [aria-hidden="true"]' as const;
