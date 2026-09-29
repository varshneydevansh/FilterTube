import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const source = fs.readFileSync(path.join(root, 'js/tab-view.js'), 'utf8');
const batch = JSON.parse(fs.readFileSync(path.join(root, 'data/ui_locales/batches/managed-link-policy.json'), 'utf8'));

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing ${endNeedle}`);
  return text.slice(start, end);
}

const modal = sliceBetween(source, 'async function showNanahManagedLinkModal(', 'function buildNanahProfileScopedLinkId(');

function placeholders(text) {
  return [...new Set([...text.matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)].map(match => match[1]))].sort();
}

test('managed-link modal source batch covers all feature copy with stable English fallbacks', () => {
  assert.ok(batch.english && typeof batch.english === 'object');
  assert.equal(batch.translations, undefined, 'locale translations are merged in a separate pass');
  const entries = Object.entries(batch.english);
  assert.equal(entries.length, 73);

  for (const [key, fallback] of entries) {
    assert.ok(key.startsWith('dashboard.sync.managedPolicy.'), `unexpected key ${key}`);
    assert.equal(typeof fallback, 'string');
    assert.ok(fallback.trim(), `empty fallback for ${key}`);
    assert.doesNotMatch(fallback, /<[^>]+>/, `${key} must be plain text, not markup`);

    const suffix = key.slice('dashboard.sync.managedPolicy.'.length);
    if (suffix.startsWith('caller.')) {
      assert.ok(source.includes(key), `${key} is not wired at a managed-link caller`);
    } else if (suffix.startsWith('scope.description.')) {
      const scope = suffix.slice('scope.description.'.length);
      const scopeProperty = ({ rulesBundle: 'rules_bundle', viewingSpace: 'viewing_space', timeLimits: 'time_limits' })[scope] || scope;
      const isDefaultActiveScope = scope === 'active' && source.includes("['active', 'The currently active FilterTube profile snapshot.']");
      assert.ok(isDefaultActiveScope || source.includes(`${scopeProperty}: ['${scope}'`), `${key} is missing from the modal scope-description map`);
    } else {
      assert.ok(modal.includes(`'${suffix}'`), `${key} is not wired in the modal`);
    }
  }

  assert.deepEqual(placeholders(batch.english['dashboard.sync.managedPolicy.caller.message.editTrust']), ['deviceLabel']);
  assert.deepEqual(placeholders(batch.english['dashboard.sync.managedPolicy.caller.message.firstUpdate']), ['remoteLabel', 'targetProfileContext']);
  assert.deepEqual(placeholders(batch.english['dashboard.sync.managedPolicy.caller.intro.editTrust']), ['scopes', 'strategy']);
  assert.deepEqual(placeholders(batch.english['dashboard.sync.managedPolicy.scope.copy.locked']), ['scopes']);
  assert.deepEqual(placeholders(batch.english['dashboard.sync.managedPolicy.target.copy.fixed']), ['profileName']);
  assert.deepEqual(placeholders(batch.english['dashboard.sync.managedPolicy.target.fixed.title']), ['profileName']);
});

test('managed-link modal localizes copy while preserving policy decisions and validation', () => {
  assert.ok(modal.includes('const allowedScopes = scopeOptions.filter((scope) => scopeInputs.get(scope)?.checked || lockedScopes.includes(scope))'));
  assert.ok(modal.includes('if (lockedScopes.some((scope) => !allowedScopes.includes(scope)))'));
  assert.ok(modal.includes("applyMode: replaceInput.checked ? 'replace' : 'merge'"));
  assert.ok(modal.includes("autoApplyControlProposals: childProtectionLevel === 'strict' ? false"));
  assert.ok(modal.includes("reconnectMode: childProtectionLevel === 'strict' ? 'approval_needed'"));
  assert.ok(modal.includes('targetProfileBehavior,\n'));
  assert.ok(modal.includes("closeWith({ action: 'apply_once', policy })"));
  assert.ok(modal.includes("closeWith({ action: 'save', policy })"));
  assert.ok(modal.includes("text('error.noAllowedScopes'"));
  assert.ok(modal.includes("text('error.lockedScopes'"));
  assert.ok(!modal.includes('.innerHTML ='), 'translated option copy is inserted as text, not interpreted as HTML');
});
