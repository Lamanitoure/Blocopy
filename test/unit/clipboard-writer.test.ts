// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AsyncClipboardWriter } from '../../src/content/clipboard/clipboard-writer.js';
import type { ClipboardPayload } from '../../src/shared/types.js';

describe('AsyncClipboardWriter (Spec Section 8.7 & Phase 4 Task 1)', () => {
  let fakeClipboard: Clipboard;
  let writeMock: ReturnType<typeof vi.fn<(data: ClipboardItem[]) => Promise<void>>>;
  let writeTextMock: ReturnType<typeof vi.fn<(text: string) => Promise<void>>>;

  const testPayload: ClipboardPayload = {
    html: '<p>Hello <strong>world</strong></p>',
    text: 'Hello world',
  };

  beforeEach(() => {
    writeMock = vi.fn<(data: ClipboardItem[]) => Promise<void>>().mockResolvedValue(undefined);
    writeTextMock = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);

    fakeClipboard = {
      write: writeMock,
      writeText: writeTextMock,
    } as unknown as Clipboard;

    // Provide ClipboardItem mock if not in jsdom environment
    if (typeof globalThis.ClipboardItem === 'undefined') {
      class MockClipboardItem {
        public readonly items: Record<string, Blob>;
        public constructor(items: Record<string, Blob>) {
          this.items = items;
        }
      }
      globalThis.ClipboardItem = MockClipboardItem as unknown as typeof ClipboardItem;
    }
  });

  // 1. Successful write calls navigator.clipboard.write with both HTML and plain text
  it('1. writes ClipboardItem containing both text/html and text/plain blobs', async () => {
    const writer = new AsyncClipboardWriter(fakeClipboard);
    await writer.write(testPayload);

    expect(writeMock).toHaveBeenCalledTimes(1);
    const passedItems = writeMock.mock.calls[0]?.[0];
    expect(passedItems).toBeDefined();
    expect(passedItems).toHaveLength(1);

    const item = passedItems?.[0] as unknown as { items: Record<string, Blob> };
    expect(item.items['text/html']).toBeInstanceOf(Blob);
    expect(item.items['text/plain']).toBeInstanceOf(Blob);
    expect(writeTextMock).not.toHaveBeenCalled();
  });

  // 2. Fallback to writeText when write rejects
  it('2. falls back to writeText with plain text when write rejects', async () => {
    writeMock.mockRejectedValue(new Error('HTML format not allowed'));

    const writer = new AsyncClipboardWriter(fakeClipboard);
    await writer.write(testPayload);

    expect(writeMock).toHaveBeenCalledTimes(1);
    expect(writeTextMock).toHaveBeenCalledTimes(1);
    expect(writeTextMock).toHaveBeenCalledWith('Hello world');
  });

  // 3. Throws when both write and fallback writeText fail
  it('3. rethrows error when both write and fallback writeText fail', async () => {
    const writeError = new Error('Clipboard write failed');
    const writeTextError = new Error('writeText failed');

    writeMock.mockRejectedValue(writeError);
    writeTextMock.mockRejectedValue(writeTextError);

    const writer = new AsyncClipboardWriter(fakeClipboard);
    await expect(writer.write(testPayload)).rejects.toThrow('writeText failed');

    expect(writeMock).toHaveBeenCalledTimes(1);
    expect(writeTextMock).toHaveBeenCalledTimes(1);
  });
});
