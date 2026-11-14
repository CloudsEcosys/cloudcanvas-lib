/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Shared fixtures for the sandbox serializer suites: boards on throwaway hosts,
 * and the four-blit tree every round-trip test builds.
 */
import { createBoard } from '../../sandbox/board.js';

/**
 * A board on a fresh host appended to the body; the document reset between tests
 * takes it away.
 */
export function freshBoard() {
  const host = document.createElement('div');
  document.body.appendChild(host);
  return createBoard(host, { label: 'Test board' });
}

/**
 * Three levels, four blits: a card, a chromeless raw child with a focus trait, a
 * gauge grandchild with selectable text and no drag, and a borderless media
 * sibling that is not selectable.
 */
export function buildTree(app) {
  const root = app.blit({
    id: 'sandbox_root', x: 10, y: 20, z: 1, type: 'card', drag: true, select: true,
    card: { title: 'Root', body: 'top of the tree' }
  });
  const child = root.blit({
    id: 'sandbox_child', x: 5, y: 6, type: 'raw', chrome: false, drag: true, select: true,
    raw: { html: '<b>nested</b>' }, focus: true
  });
  child.blit({
    id: 'sandbox_grandchild', x: 1, y: 2, type: 'vector-pointer', select: true, selectableText: true,
    vectorPointer: { angle: 30, magnitude: 3 }
  });
  app.blit({
    id: 'sandbox_sibling', x: 99, y: 98, type: 'media', drag: true, bordered: false,
    media: { src: 'diagram.png' }
  });
  return root;
}
