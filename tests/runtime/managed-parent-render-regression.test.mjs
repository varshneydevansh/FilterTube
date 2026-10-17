import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../../js/managed_parent_command_center.js', import.meta.url), 'utf8');

function element(tag) {
  const events = new Map();
  return {
    tagName: tag.toUpperCase(), className: '', dataset: {}, children: [], attributes: {}, textContent: '',
    append(...children) { this.children.push(...children); },
    appendChild(child) { this.children.push(child); return child; },
    prepend(...children) { this.children.unshift(...children); },
    setAttribute(name, value) { this.attributes[name] = value; },
    addEventListener(name, callback) { events.set(name, callback); },
    click() { events.get('click')?.({ preventDefault() {} }); },
    classList: { toggle() {} }
  };
}

function descendants(tree) {
  return [tree, ...tree.children.flatMap(descendants)];
}

function fixture({ targetCount = 0, configured = false, withActions = true } = {}) {
  const calls = [];
  const context = { document: { createElement: element } };
  vm.runInNewContext(source, context);
  const profiles = {
    activeProfileId: 'parent',
    profiles: {
      parent: { name: 'Parent', type: 'account' },
      child: { name: 'Child', type: 'child', parentId: 'parent' }
    }
  };
  const helpers = {
    getAccountIds: () => ['parent'],
    getChildrenForAccount: (_, account) => account === 'parent' ? ['child'] : [],
    canActiveProfileManageProfile: (_, id) => id === 'child',
    getProfileType: (root, id) => root.profiles[id].type,
    getManagedSyncTargetSummary: () => ({
      targetCount, readyCount: targetCount, totalCount: targetCount, openCheckCount: 0,
      revokedCount: 0, staleCount: 0, liveReady: targetCount > 0,
      mailboxReady: false, localNetworkReady: false, label: targetCount ? 'Verified device' : 'Pair device'
    }),
    getManagedMailboxConfigSummary: () => ({ configured }),
    getManagedLocalNetworkConfigSummary: () => ({ configured: false }),
    ...(withActions ? { onAction: intent => { calls.push(intent); } } : {})
  };
  return { api: context.FilterTubeManagedParentCommandCenter, profiles, helpers, calls };
}

test('a parent with one protected profile renders its child controls without throwing', () => {
  const f = fixture();
  let panel;
  assert.doesNotThrow(() => { panel = f.api.render(f.profiles, { revealDetails: true, helpers: f.helpers }); });
  assert.equal(panel.tagName, 'SECTION');
  const nodes = descendants(panel);
  const rows = nodes.filter(node => node.className.split(' ').includes('ft-managed-command-center__row'));
  assert.equal(rows.length, 1);
  assert.ok(descendants(rows[0]).some(node => node.textContent === 'Child'));
  const edit = nodes.find(node => node.dataset.filtertubeManagedAction === 'edit_rules');
  assert.ok(edit);
  assert.equal(edit.dataset.filtertubeProfileId, 'child');
  edit.click();
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].profileId, 'child');
  assert.equal(f.calls[0].action, 'edit_rules');
  assert.ok(!nodes.some(node => node.className === 'ft-managed-command-center__provider-prompt'));
});

test('pickup setup prompts follow the rendered summary verified targets and action availability', () => {
  for (const [options, expected] of [
    [{ targetCount: 0 }, 0],
    [{ targetCount: 1 }, 1],
    [{ targetCount: 1, withActions: false }, 0],
    [{ targetCount: 1, configured: true }, 0]
  ]) {
    const f = fixture(options);
    const summary = f.api.buildSummary(f.profiles, { revealDetails: true, helpers: f.helpers });
    assert.equal(summary.rows.length, 1);
    assert.equal(summary.rows[0].syncTargetCount, options.targetCount);
    let panel;
    assert.doesNotThrow(() => { panel = f.api.render(f.profiles, { revealDetails: true, helpers: f.helpers }); });
    const prompts = descendants(panel).filter(node => node.className === 'ft-managed-command-center__provider-prompt');
    assert.equal(prompts.length, expected);
    if (expected) {
      const setup = descendants(prompts[0]).find(node => node.tagName === 'BUTTON' && node.textContent === 'Internet Pickup');
      setup.click();
      assert.equal(f.calls[0].action, 'configure_mailbox');
    }
  }
});

test('hidden protected details stay hidden and an empty parent renders setup controls', () => {
  const f = fixture();
  assert.equal(f.api.render(f.profiles, { revealDetails: false, helpers: f.helpers }), null);
  f.helpers.getChildrenForAccount = () => [];
  const panel = f.api.render(f.profiles, { revealDetails: true, helpers: f.helpers });
  const nodes = descendants(panel);
  assert.ok(nodes.some(node => node.textContent === 'Create Protected Profile'));
  assert.ok(!nodes.some(node => node.className === 'ft-managed-command-center__row'));
});
