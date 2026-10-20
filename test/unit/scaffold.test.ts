import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

interface BudgetsConfig {
  readonly contentJsMaxMinifiedBytes: number;
  readonly contentJsMaxGzipBytes: number;
  readonly popupJsMaxMinifiedBytes: number;
  readonly packageExcludingLocalesMaxBytes: number;
}

interface LocaleMessage {
  readonly message: string;
}

type MessagesMap = Record<string, LocaleMessage>;

describe('Phase 0 Skeleton', () => {
  it('loads budgets.json with expected keys', () => {
    const raw = fs.readFileSync(path.join(process.cwd(), 'budgets.json'), 'utf8');
    const budgets = JSON.parse(raw) as BudgetsConfig;
    expect(budgets.contentJsMaxMinifiedBytes).toBeGreaterThan(0);
    expect(budgets.contentJsMaxGzipBytes).toBeGreaterThan(0);
    expect(budgets.popupJsMaxMinifiedBytes).toBeGreaterThan(0);
    expect(budgets.packageExcludingLocalesMaxBytes).toBeGreaterThan(0);
  });

  it('loads _locales/en/messages.json with mandatory keys', () => {
    const raw = fs.readFileSync(path.join(process.cwd(), '_locales', 'en', 'messages.json'), 'utf8');
    const messages = JSON.parse(raw) as MessagesMap;
    expect(messages['extName']?.message).toBe('Blocopy');
    expect(messages['extDescription']?.message.length).toBeLessThanOrEqual(132);
    expect(messages['toastCopied']?.message).toBe('Copied');
  });
});
