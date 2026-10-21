// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { findLevels } from '../../src/content/dom/level-finder.js';
import { MAX_LEVELS, MAX_SELECTION_CHARS } from '../../src/shared/config/limits.js';

describe('Level Finder (Spec Section 8.2)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  // Test 1: Article with 3 paragraphs -> click the 2nd -> level 0 is the article
  it('1. Article with 3 paragraphs -> click the 2nd -> level 0 is the article', () => {
    const article = document.createElement('article');
    const p1 = document.createElement('p');
    p1.textContent = 'P1';
    const p2 = document.createElement('p');
    p2.textContent = 'P2';
    const p3 = document.createElement('p');
    p3.textContent = 'P3';
    article.append(p1, p2, p3);
    document.body.appendChild(article);

    const levels = findLevels(p2);
    expect(levels.length).toBeGreaterThanOrEqual(1);
    expect(levels[0]).toBe(article);
  });

  // Test 2: List of 5 div.message, each with one p -> click in one -> level 0 is that message and it is the only level
  it('2. List of 5 div.message, each with one p -> click in one -> level 0 is that message and only level', () => {
    const chat = document.createElement('div');
    chat.className = 'chat-container';
    const messages: HTMLElement[] = [];

    for (let i = 0; i < 5; i += 1) {
      const msg = document.createElement('div');
      msg.className = 'message';
      const p = document.createElement('p');
      p.textContent = `Message ${String(i)}`;
      msg.appendChild(p);
      chat.appendChild(msg);
      messages.push(msg);
    }
    document.body.appendChild(chat);

    const targetP = messages[1]?.querySelector('p');
    expect(targetP).not.toBeNull();

    const levels = findLevels(targetP as Element);
    expect(levels.length).toBe(1);
    expect(levels[0]).toBe(messages[1]);
  });

  // Test 3: Message with p, ul, p -> click inside an li -> level 0 is the message div, not the ul
  it('3. Message with p, ul, p -> click inside an li -> level 0 is the message div, not the ul', () => {
    const msg = document.createElement('div');
    msg.className = 'message-card';
    const p1 = document.createElement('p');
    p1.textContent = 'Intro';
    const ul = document.createElement('ul');
    const li1 = document.createElement('li');
    li1.textContent = 'Item 1';
    const li2 = document.createElement('li');
    li2.textContent = 'Item 2';
    ul.append(li1, li2);
    const p2 = document.createElement('p');
    p2.textContent = 'Outro';
    msg.append(p1, ul, p2);
    document.body.appendChild(msg);

    const levels = findLevels(li1);
    expect(levels.length).toBeGreaterThanOrEqual(1);
    expect(levels[0]).toBe(msg);
  });

  // Test 4: Only a ul of 3 items inside a div -> level 0 is the div
  it('4. Only a ul of 3 items inside a div -> level 0 is the div', () => {
    const div = document.createElement('div');
    const ul = document.createElement('ul');
    const li1 = document.createElement('li');
    li1.textContent = 'Item 1';
    const li2 = document.createElement('li');
    li2.textContent = 'Item 2';
    const li3 = document.createElement('li');
    li3.textContent = 'Item 3';
    ul.append(li1, li2, li3);
    div.appendChild(ul);
    document.body.appendChild(div);

    const levels = findLevels(li2);
    expect(levels.length).toBeGreaterThanOrEqual(1);
    expect(levels[0]).toBe(div);
  });

  // Test 5: Click inside a table cell -> [] (no unit)
  it('5. Click inside a table cell -> [] (no unit)', () => {
    const table = document.createElement('table');
    const tbody = document.createElement('tbody');
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.textContent = 'Just raw cell text without paragraph';
    tr.appendChild(td);
    tbody.appendChild(tr);
    table.appendChild(tbody);
    document.body.appendChild(table);

    const levels = findLevels(td);
    expect(levels).toEqual([]);
  });

  // Test 6: Page text above the budget -> the oversized ancestor is never returned
  it('6. Page text above the budget -> oversized ancestor is never returned', () => {
    const hugeContainer = document.createElement('div');
    const p1 = document.createElement('p');
    p1.textContent = 'Target paragraph';
    const p2 = document.createElement('p');
    // Fill with text exceeding MAX_SELECTION_CHARS
    p2.textContent = 'A'.repeat(MAX_SELECTION_CHARS + 100);
    hugeContainer.append(p1, p2);
    document.body.appendChild(hugeContainer);

    const levels = findLevels(p1);
    // hugeContainer should not be returned because it exceeds text budget
    expect(levels).not.toContain(hugeContainer);
  });

  // Test 7: Nested containers produce strictly growing levels, never more than MAX_LEVELS
  it('7. Nested containers produce strictly growing levels, never more than MAX_LEVELS', () => {
    const level4 = document.createElement('div');
    const level3 = document.createElement('div');
    const level2 = document.createElement('div');
    const level1 = document.createElement('div');
    const level0 = document.createElement('article');

    level0.append(
      Object.assign(document.createElement('p'), { textContent: 'Unit 1' }),
      Object.assign(document.createElement('p'), { textContent: 'Unit 2' })
    );
    level1.append(level0, Object.assign(document.createElement('p'), { textContent: 'Unit 3' }));
    level2.append(level1, Object.assign(document.createElement('p'), { textContent: 'Unit 4' }));
    level3.append(level2, Object.assign(document.createElement('p'), { textContent: 'Unit 5' }));
    level4.append(level3, Object.assign(document.createElement('p'), { textContent: 'Unit 6' }));

    document.body.appendChild(level4);

    const target = level0.querySelector('p') as Element;
    const levels = findLevels(target);

    expect(levels.length).toBeLessThanOrEqual(MAX_LEVELS);
    expect(levels.length).toBeGreaterThanOrEqual(1);

    // Each strictly contains the previous
    for (let i = 1; i < levels.length; i += 1) {
      const prev = levels[i - 1];
      const curr = levels[i];
      expect(curr?.contains(prev as Node)).toBe(true);
      expect(curr).not.toBe(prev);
    }
  });

  // Test 8: Target inside body directly with a single paragraph and no container -> []
  it('8. Target inside body directly with a single paragraph and no container -> []', () => {
    const singleP = document.createElement('p');
    singleP.textContent = 'Alone in body';
    document.body.appendChild(singleP);

    const levels = findLevels(singleP);
    expect(levels).toEqual([]);
  });

  it('9. Semantic article selects div-only text as one complete block', () => {
    const article = document.createElement('article');
    const message = document.createElement('div');
    const text = document.createElement('div');
    text.textContent = 'A message made of nested divs';
    message.appendChild(text);
    article.appendChild(message);
    document.body.appendChild(article);

    const levels = findLevels(text);
    expect(levels[0]).toBe(article);
  });

  it('10. Custom components with direct text are selectable containers', () => {
    const response = document.createElement('conversation-response');
    response.textContent = 'A response in a custom element';
    document.body.appendChild(response);

    const levels = findLevels(response);
    expect(levels[0]).toBe(response);
  });

  it('11. ARIA article with div-only text is a selectable level', () => {
    const message = document.createElement('div');
    message.setAttribute('role', 'article');
    const text = document.createElement('div');
    text.textContent = 'A response in an ARIA article';
    message.appendChild(text);
    document.body.appendChild(message);

    const levels = findLevels(text);
    expect(levels[0]).toBe(message);
  });

  it('12. Repeated generic text blocks select their containing conversation', () => {
    const conversation = document.createElement('div');
    const response = document.createElement('div');
    response.className = 'message';
    response.textContent = 'First response';
    const otherResponse = document.createElement('div');
    otherResponse.className = 'message';
    otherResponse.textContent = 'Second response';
    const thirdResponse = document.createElement('div');
    thirdResponse.className = 'message';
    thirdResponse.textContent = 'Third response';
    conversation.append(response, otherResponse, thirdResponse);
    document.body.appendChild(conversation);

    const levels = findLevels(response);
    expect(levels[0]).toBe(response);
  });

  it('13. Generic wrapper groups multiple text blocks before its semantic article', () => {
    const article = document.createElement('article');
    const message = document.createElement('div');
    const firstBlock = document.createElement('div');
    firstBlock.textContent = 'First block';
    const secondBlock = document.createElement('div');
    secondBlock.textContent = 'Second block';
    message.append(firstBlock, secondBlock);
    article.appendChild(message);
    document.body.appendChild(article);

    const levels = findLevels(firstBlock);
    expect(levels[0]).toBe(message);
    expect(levels[1]).toBe(article);
  });
});
