// Pure reducer state machine for Blocopy selection sessions (Spec Section 9.1)

export type SessionState =
  | { readonly kind: 'idle' }
  | {
      readonly kind: 'active';
      readonly levels: readonly Element[];
      readonly levelIndex: number;
      readonly excluded: ReadonlySet<Element>;
    };

export type SessionAction =
  | { readonly type: 'start'; readonly levels: readonly Element[] }
  | { readonly type: 'expand' }
  | { readonly type: 'back' }
  | { readonly type: 'toggle'; readonly unit: Element }
  | { readonly type: 'end' };

// Handles start action initializing an active session at level 0
function reduceStart(state: SessionState, levels: readonly Element[]): SessionState {
  if (levels.length === 0) {
    return state;
  }
  return {
    kind: 'active',
    levels,
    levelIndex: 0,
    excluded: new Set<Element>(),
  };
}

// Handles expand action climbing to the next container level
function reduceExpand(state: SessionState & { readonly kind: 'active' }): SessionState {
  if (state.levelIndex >= state.levels.length - 1) {
    return state;
  }
  return {
    kind: 'active',
    levels: state.levels,
    levelIndex: state.levelIndex + 1,
    excluded: new Set<Element>(),
  };
}

// Handles back action stepping down one level or canceling session at level 0
function reduceBack(state: SessionState & { readonly kind: 'active' }): SessionState {
  if (state.levelIndex <= 0) {
    return { kind: 'idle' };
  }
  return {
    kind: 'active',
    levels: state.levels,
    levelIndex: state.levelIndex - 1,
    excluded: new Set<Element>(),
  };
}

// Handles toggle action toggling unit exclusion inside the current container
function reduceToggle(
  state: SessionState & { readonly kind: 'active' },
  unit: Element
): SessionState {
  const currentContainer = state.levels[state.levelIndex];
  if (!currentContainer || !currentContainer.contains(unit)) {
    return state;
  }

  const nextExcluded = new Set<Element>(state.excluded);
  if (nextExcluded.has(unit)) {
    nextExcluded.delete(unit);
  } else {
    nextExcluded.add(unit);
  }

  return {
    kind: 'active',
    levels: state.levels,
    levelIndex: state.levelIndex,
    excluded: nextExcluded,
  };
}

// Pure reducer applying session actions to produce new immutable state
export function reduce(state: SessionState, action: SessionAction): SessionState {
  if (action.type === 'start') {
    return reduceStart(state, action.levels);
  }

  if (state.kind === 'idle') {
    return state;
  }

  if (action.type === 'end') {
    return { kind: 'idle' };
  }

  if (action.type === 'expand') {
    return reduceExpand(state);
  }

  if (action.type === 'back') {
    return reduceBack(state);
  }

  return reduceToggle(state, action.unit);
}
