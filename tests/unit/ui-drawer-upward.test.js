/** Written by Richard Christopher, Copyright 2026 NeoTec, LLC */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createDrawer } from '../../ui/index.js';
import { mount } from '../helpers/ui.js';

// RED observed before support: scale(1)/scale(0.2) rather than the two translateY frames.
test('drawer upward motion translates its full width vertically instead of shrinking to its control', (t) => {
  const host = mount(t), control = document.createElement('button'); host.append(control);
  const drawer = createDrawer(host), travels = [];
  const animate = drawer.panel.animate;
  drawer.panel.animate = function (frames, timing) {
    travels.push({ frames, timing }); return animate.call(this, frames, timing);
  };
  t.after(() => drawer.destroy());
  drawer.update({ open: true, collapseTo: control, collapseDirection: 'up' });
  drawer.update({ open: false, collapseTo: control, collapseDirection: 'up' });
  assert.deepEqual(travels[0].frames, [{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }]);
  assert.equal(control.getAttribute('aria-expanded'), 'false');
  drawer.destroy();
  assert.equal(control.hasAttribute('aria-controls'), false);
});
