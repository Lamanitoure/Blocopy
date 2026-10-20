// Minimum number of leaf units required for a valid candidate container
export const MIN_UNITS_PER_CONTAINER = 2;

// Maximum number of container hierarchy levels computed for a target
export const MAX_LEVELS = 4;

// Upper threshold on characters to prevent selection of oversized ancestor subtrees
export const MAX_SELECTION_CHARS = 200_000;

// Threshold of identical siblings indicating a repeated collection item (e.g. chat messages)
export const REPEATED_SIBLINGS_THRESHOLD = 3;

// Maximum number of toast notifications shown simultaneously
export const MAX_TOAST_STACK = 1;
