import { test, expect } from 'bun:test';
import { generateTemplate, buildIndexHtml } from './template';

test('generateTemplate returns valid Tampermonkey metadata', () => {
  const template = generateTemplate();
  expect(template).toContain('// ==UserScript==');
  expect(template).toContain('// ==/UserScript==');
  expect(template).toContain('@name');
  expect(template).toContain('@namespace');
  expect(template).toContain('@version');
  expect(template).toContain('@match');
});

test('buildIndexHtml includes script URL and path', () => {
  const html = buildIndexHtml(
    'http://127.0.0.1:4889/script.user.js',
    './script.user.js',
  );
  expect(html).toContain('http://127.0.0.1:4889/script.user.js');
  expect(html).toContain('./script.user.js');
  expect(html).toContain('<a href=');
});
