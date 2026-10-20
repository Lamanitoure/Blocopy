# Contributing to Blocopy

## Development Guidelines

1. All code, comments, identifiers, docs, and commit messages must be in English.
2. Zero hardcoded magic numbers or selectors outside `src/shared/config/`.
3. No innerHTML assignments, no remote scripts, and zero runtime dependencies.
4. Run verification suite before opening pull requests:
   ```bash
   npm run verify
   ```

## Adding Translation Overrides

Human translation corrections can be added into `scripts/translation-overrides/<locale>.json`. These overrides are never overwritten by automated translation scripts.
