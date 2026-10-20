// Feasibility spike content script
// Validates:
// 1. CSS Custom Highlight API (Highlight, CSS.highlights)
// 2. navigator.clipboard.write([ClipboardItem]) without clipboardWrite permission

document.addEventListener('dblclick', async (event) => {
  if (!event.isTrusted) return;

  const target = event.target;
  const p = target.closest('p') || target;

  console.log('[Blocopy Spike] Double click detected on:', p);

  // 1. Test CSS Custom Highlight API
  try {
    if (typeof Highlight !== 'undefined' && typeof CSS !== 'undefined' && 'highlights' in CSS) {
      const range = new Range();
      range.selectNodeContents(p);
      const highlight = new Highlight(range);
      CSS.highlights.set('spike-highlight', highlight);
      console.log('[Blocopy Spike] CSS.highlights successfully set for range:', range);
    } else {
      console.warn('[Blocopy Spike] Highlight or CSS.highlights not supported in this environment.');
    }
  } catch (err) {
    console.error('[Blocopy Spike] CSS Custom Highlight error:', err);
  }

  // 2. Test Clipboard write with HTML + Plain text ClipboardItem without permission
  try {
    const htmlBlob = new Blob([`<p><strong>Spike copied:</strong> ${p.textContent || ''}</p>`], {
      type: 'text/html',
    });
    const textBlob = new Blob([p.textContent || ''], {
      type: 'text/plain',
    });

    const item = new ClipboardItem({
      'text/html': htmlBlob,
      'text/plain': textBlob,
    });

    await navigator.clipboard.write([item]);
    console.log('[Blocopy Spike] navigator.clipboard.write succeeded with ClipboardItem!');
  } catch (err) {
    console.error('[Blocopy Spike] navigator.clipboard.write failed:', err);
    try {
      await navigator.clipboard.writeText(p.textContent || '');
      console.log('[Blocopy Spike] Fallback navigator.clipboard.writeText succeeded.');
    } catch (fallbackErr) {
      console.error('[Blocopy Spike] Fallback writeText also failed:', fallbackErr);
    }
  }
});
