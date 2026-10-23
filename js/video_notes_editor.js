/* Extension-origin editor: personal text never enters the YouTube DOM/message bus. */
(function () {
    'use strict';
    const api = typeof browser !== 'undefined' && browser.runtime ? browser : chrome;
    const token = new URLSearchParams(location.hash.slice(1)).get('key');
    const byId = id => document.getElementById(id);
    const text = byId('text'), status = byId('status'), updates = byId('updates'), versions = byId('versions');
    let base = null, latest = null, dirty = false, saving = false, loaded = false, sequence = 0, loadGeneration = 0, undo = null, reviewedRecord = null;
    const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    function send(action, extra = {}) {
        return new Promise(resolve => api.runtime.sendMessage({ action: 'FilterTube_Notes' + action, token, ...extra },
            result => resolve(api.runtime.lastError ? { ok: false } : result || { ok: false })));
    }
    function controls() {
        byId('counter').textContent = text.value.length.toLocaleString('en') + ' / 16,000';
        text.setAttribute('aria-invalid', text.value.length > 16000 ? 'true' : 'false');
        byId('save').disabled = !loaded || saving || !dirty || !updates.hidden || text.value.length > 16000;
        byId('insert-time').disabled = !loaded || saving || text.disabled;
        byId('moments').disabled = !loaded || saving || text.disabled;
        byId('delete').disabled = !loaded || saving || !updates.hidden || !base || base.versions.length !== 1 || base.versions[0].text === null;
    }
    async function keepDraft() {
        if (text.value.length > 16000) { status.textContent = 'Your text is still here. Shorten it to 16,000 characters before saving or leaving.'; return; }
        const result = await send('Draft', { text: text.value, base, sequence });
        if (!result.ok) status.textContent = 'Draft could not be kept. Save before leaving this page.';
    }
    function timestamps(value) {
        const matches = [];
        for (const match of value.matchAll(/(?<![\w:])\d{1,9}(?::\d{1,2}){1,2}(?![\w:])/g)) {
            const start = Math.max(value.lastIndexOf(' ', match.index - 1), value.lastIndexOf('\n', match.index - 1), value.lastIndexOf('\t', match.index - 1)) + 1;
            const prefix = value.slice(start, match.index);
            if (prefix.includes('://') || prefix.startsWith('www.')) continue;
            const parts = match[0].split(':').map(Number);
            if (parts.at(-1) > 59 || (parts.length === 3 && parts[1] > 59)) continue;
            const seconds = parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1];
            if (seconds <= 86400) matches.push({ label: match[0], index: match.index, seconds });
        }
        return matches;
    }
    function preview(record) {
        const target = byId('preview'); target.replaceChildren();
        if (!record || record.versions.length !== 1 || record.versions[0].text === null) {
            target.textContent = record?.versions.length > 1 ? 'Choose between the saved versions above.' : 'No saved note yet.'; return;
        }
        const value = record.versions[0].text;
        let at = 0;
        for (const match of timestamps(value).slice(0, 64)) {
            target.appendChild(document.createTextNode(value.slice(at, match.index)));
            const seconds = match.seconds;
            const button = document.createElement('button'); button.type = 'button'; button.textContent = match.label;
            button.setAttribute('aria-label', 'Jump to ' + match.label + ' in this video');
            button.addEventListener('click', async () => {
                const result = await send('Seek', { seconds });
                if (!result.ok) status.textContent = 'Timestamp seek is unavailable for this player or the current access rules.';
            });
            target.appendChild(button); at = match.index + match.label.length;
        }
        target.appendChild(document.createTextNode(value.slice(at)));
    }
    function showIncoming() {
        reviewedRecord = null; updates.hidden = false; versions.hidden = true; versions.replaceChildren(); byId('keep').hidden = true;
        status.textContent = 'Review the saved version before replacing it.'; controls();
    }
    function use(record) {
        base = record; latest = record;
        if (record?.versions.length > 1) {
            text.value = ''; text.disabled = true; dirty = false; showIncoming();
        } else {
            text.value = record?.versions[0].text || ''; text.disabled = false; dirty = false; updates.hidden = true;
        }
        preview(record); controls();
    }
    async function load() {
        const attempt = ++loadGeneration;
        const result = await send('Read');
        if (attempt !== loadGeneration || saving) return;
        if (!result.ok) {
            loaded = false; text.value = ''; text.disabled = true; versions.replaceChildren(); updates.hidden = true;
            byId('preview').textContent = ''; status.textContent = 'Notes access changed. Return to the current allowed video and reopen Notes.'; controls(); return;
        }
        if (!loaded) {
            loaded = true;
            if (result.draft) {
                base = result.draft.base; text.value = result.draft.text; text.disabled = false; dirty = true; sequence++;
                latest = result.record; preview(latest);
                if (!equal(base, latest) || latest?.versions.length > 1) showIncoming();
                status.textContent = 'Your temporary draft was restored.'; void keepDraft();
            } else { use(result.record); status.textContent = 'Notes are private to this FilterTube profile.'; }
            if (!text.disabled) text.focus();
        } else if (!equal(latest, result.record)) {
            latest = result.record; preview(latest);
            if (dirty) showIncoming(); else use(latest);
        }
        controls();
    }
    function changed() {
        byId('moments-list').hidden = true;

        sequence++; dirty = true; undo = null; byId('undo').hidden = true;
        status.textContent = 'Unsaved draft'; controls(); void keepDraft();
    }
    text.addEventListener('input', changed);
    const timecode = seconds => {
        const hours = Math.floor(seconds / 3600), minutes = Math.floor(seconds / 60) % 60, remainder = String(seconds % 60).padStart(2, '0');
        return hours ? hours + ':' + String(minutes).padStart(2, '0') + ':' + remainder : minutes + ':' + remainder;
    };
    byId('insert-time').addEventListener('click', async () => {
        if (!loaded || saving || text.disabled) return;
        const captured = sequence, start = text.selectionStart, end = text.selectionEnd;
        const result = await send('Position');
        if (!loaded || saving || text.disabled || captured !== sequence) return;
        if (!result.ok || !Number.isSafeInteger(result.seconds) || result.seconds < 0 || result.seconds > 86400) {
            status.textContent = 'Current time is unavailable for this player or the current access rules.'; return;
        }
        const insertion = (start > 0 && text.value[start - 1] !== '\n' ? '\n' : '') + timecode(result.seconds) + ' ';
        if (text.value.length - (end - start) + insertion.length > 16000) { status.textContent = 'There is no room for a timestamp. Shorten your note first.'; return; }
        text.setRangeText(insertion, start, end, 'end'); changed(); text.focus();
    });
    byId('moments').addEventListener('click', () => {
        if (!loaded || saving || text.disabled) return;
        const list = byId('moments-list'); list.replaceChildren();
        const times = new Set();
        for (const match of timestamps(text.value)) if (times.size < 64) times.add(match.seconds);
        if (!times.size) { list.hidden = true; status.textContent = 'Add a timestamp such as 1:30 to your note first.'; return; }
        for (const seconds of [...times].sort((a, b) => a - b)) {
            const button = document.createElement('button'); button.type = 'button'; button.textContent = timecode(seconds);
            button.setAttribute('aria-label', 'Jump to ' + timecode(seconds) + ' in this video');
            button.addEventListener('click', async () => {
                const result = await send('Seek', { seconds });
                if (!result.ok) status.textContent = 'Timestamp seek is unavailable for this player or the current access rules.';
            });
            list.appendChild(button);
        }
        list.hidden = false; list.children[0].focus();
    });
    async function save(value = text.value) {
        if (!loaded || saving || !updates.hidden || text.value.length > 16000) return;
        saving = true; loadGeneration++; controls();
        const captured = sequence, baseline = base;
        const result = await send('Save', { base: baseline, text: value, sequence: captured });
        saving = false;
        if (!result.ok) {
            dirty = true; controls();
            status.textContent = 'Could not confirm the save. Your text is still here; check access and browser storage before trying again.';
            void keepDraft(); return;
        }
        latest = result.record;
        if (!result.saved) { showIncoming(); preview(latest); return; }
        if (sequence === captured) use(latest);
        else { base = latest; sequence++; dirty = true; void keepDraft(); }
        status.textContent = sequence === captured ? 'Saved on this browser.' : 'Saved. You have newer unsaved changes.';
        preview(latest); controls();
    }
    byId('form').addEventListener('submit', event => { event.preventDefault(); void save(); });
    byId('delete').addEventListener('click', async () => {
        if (dirty) { status.textContent = 'Save or discard your draft before deleting the saved note.'; return; }
        const previous = base?.versions[0]?.text;
        sequence++; dirty = true; await keepDraft();
        await save(null);
        if (loaded && base?.versions.length === 1 && base.versions[0].text === null) {
            undo = previous; byId('undo').hidden = false; status.textContent = 'Note deleted. You can undo before leaving.';
        }
    });
    byId('undo').addEventListener('click', () => {
        if (typeof undo !== 'string') return;
        text.value = undo; sequence++; dirty = true; byId('undo').hidden = true; controls(); void keepDraft();
    });
    byId('review').addEventListener('click', () => {
        versions.replaceChildren(); versions.hidden = false;
        reviewedRecord = latest;
        const reviewed = reviewedRecord;
        const heads = reviewed?.versions || [{ text: null }];
        heads.forEach((head, index) => {
            const article = document.createElement('article'), title = document.createElement('strong'), body = document.createElement('pre');
            title.textContent = 'Saved version ' + (index + 1); body.textContent = head.text === null ? 'This version deletes the note.' : head.text;
            const choose = document.createElement('button'); choose.type = 'button'; choose.textContent = 'Use this version';
            choose.addEventListener('click', () => {
                if (!equal(reviewed, latest)) { showIncoming(); return; }
                base = reviewed; text.value = head.text || ''; text.disabled = false; dirty = true; sequence++;
                updates.hidden = true; status.textContent = 'Version chosen. Save to confirm.'; controls(); void keepDraft(); text.focus();
            });
            article.append(title, body, choose); versions.appendChild(article);
        });
        byId('keep').hidden = !dirty;
    });
    byId('keep').addEventListener('click', () => {
        if (versions.hidden || !equal(reviewedRecord, latest)) { showIncoming(); return; }
        base = reviewedRecord; updates.hidden = true; sequence++; dirty = true; text.disabled = false; controls();
        status.textContent = 'Your draft is kept. Save to replace the reviewed versions.'; void keepDraft(); text.focus();
    });
    async function close() { await send('Close'); }
    byId('close').addEventListener('click', () => { if (dirty) { byId('confirm').hidden = false; byId('stay').focus(); } else void close(); });
    byId('stay').addEventListener('click', () => { byId('confirm').hidden = true; text.focus(); });
    byId('discard').addEventListener('click', async () => { await send('DiscardDraft'); dirty = false; await close(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') byId('close').click(); });
    api.storage.onChanged.addListener((changes, area) => { if (area === 'local' && changes.ftSavedVideoNotesV1 && !saving) void load(); });
    setInterval(() => { if (!saving) void load(); }, 3000);
    void load();
}());
