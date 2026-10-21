// CSS selector matching candidate leaf unit elements
export const UNIT_SELECTOR = 'p, li, h1, h2, h3, h4, h5, h6, blockquote, pre, dt, dd, figcaption' as const;

// Interactive elements that Blocopy must never intercept
export const INTERACTIVE_SELECTOR = 'input, textarea, select, button, a, summary, video, audio, canvas, iframe, object, embed, [contenteditable]' as const;

// Tag names that group units but should not be selected as solitary containers
export const NON_CONTAINER_TAGS = ['UL', 'OL', 'DL', 'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR'] as const;

// Boundary tags at which container hierarchy climbing must stop
export const HARD_STOP_TAGS = ['BODY', 'HTML'] as const;

// Semantic container elements preferred when selecting enclosing text blocks
export const PREFERRED_CONTAINER_SELECTOR = 'article, [role="article"], blockquote, details' as const;
