/* Presentation only. The controller owns paired grants, authorization and transport. */
(function (global, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else global.FilterTubeDeviceAutoSyncUI = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    let serial = 0;
    function install({ root, controller, context = {}, text }) {
        if (!root?.ownerDocument || typeof controller?.view !== 'function') throw Error('autosync_ui_unavailable');
        const document = root.ownerDocument, prefix = 'ft-auto-sync-' + ++serial;
        const tr = (key, fallback, values = {}) => {
            const translated = typeof text === 'function' ? text('dashboard.sync.auto.' + key, fallback, values) : fallback;
            return String(translated || fallback).replace(/\{(\w+)\}/g, (match, name) => Object.hasOwn(values, name) ? String(values[name]) : match);
        };
        const setText = (node, value) => { if (node.textContent !== value) node.textContent = value; };
        function make(tag, className, content) {
            const node = document.createElement(tag);
            if (className) node.className = className;
            if (content !== undefined) node.textContent = content;
            return node;
        }
        function button(content, className = '') {
            const node = make('button', 'ft-auto-sync__button ' + className, content); node.type = 'button'; return node;
        }
        function labelled(tag, labelText, id) {
            const label = make('label', 'ft-auto-sync__label', labelText); label.htmlFor = id;
            const input = make(tag); input.id = id;
            return { label, input };
        }
        const panel = make('section', 'ft-auto-sync');
        panel.setAttribute('aria-labelledby', prefix + '-title');
        const heading = make('h4', 'ft-auto-sync__title', tr('title', 'Peer-to-peer sync'));
        heading.id = prefix + '-title'; heading.tabIndex = -1;
        const intro = make('p', 'ft-auto-sync__intro');
        const notice = make('p', 'ft-auto-sync__notice'); notice.hidden = true;
        const managedSection = make('div', 'ft-auto-sync__section');
        const managedHeading = make('h5', '', tr('parentUpdates', 'Parent updates'));
        const managedHelp = make('p', 'ft-auto-sync__help', tr('parentHelp', 'Only approved parent updates go to the chosen child profile. Existing permissions still apply.'));
        const { label: managedLabel, input: managedSelect } = labelled('select', tr('connection', 'Child-profile connection'), prefix + '-managed');
        const placeholder = make('option', '', tr('chooseConnection', 'Choose a connection')); placeholder.value = '';
        managedSelect.appendChild(placeholder);
        const managedControls = make('div', 'ft-auto-sync__controls');
        const managedSingle = make('strong', 'ft-auto-sync__selected-route');
        const managedToggle = button(tr('turnOn', 'Turn on Auto-sync'), 'ft-auto-sync__button--primary');
        const managedDetail = make('p', 'ft-auto-sync__detail');
        const managedStatus = make('p', 'ft-auto-sync__status'); managedStatus.setAttribute('aria-live', 'polite'); managedStatus.setAttribute('aria-atomic', 'true');
        managedControls.append(managedSingle, managedSelect, managedToggle);
        managedSection.append(managedHeading, managedHelp, managedLabel, managedControls, managedDetail, managedStatus);

        const personalSection = make('div', 'ft-auto-sync__section');
        const personalHeading = make('h5', '', tr('personalDevices', 'Your other devices')); personalHeading.tabIndex = -1;
        const personalHelp = make('p', 'ft-auto-sync__help', tr('personalHelp', 'Link this profile on both devices and choose what to keep in sync. Each device must approve the link.'));
        const personalList = make('ul', 'ft-auto-sync__links'); personalList.setAttribute('aria-label', tr('personalLinks', 'Linked personal profiles'));
        const personalForm = make('div', 'ft-auto-sync__pair-form'); personalForm.id = prefix + '-personal-form';
        const linkAnother = button(tr('linkAnother', 'Link another profile'), 'ft-auto-sync__expander');
        linkAnother.setAttribute('aria-expanded', 'false'); linkAnother.setAttribute('aria-controls', personalForm.id);
        const choices = make('fieldset', 'ft-auto-sync__choices');
        const legend = make('legend', 'ft-auto-sync__label', tr('areas', 'Keep in sync'));
        function choice(name, labelText) {
            const label = make('label', 'ft-auto-sync__choice');
            const input = make('input'); input.type = 'checkbox'; input.id = prefix + '-' + name; input.checked = false;
            const copy = make('span', '', labelText); label.append(input, copy); choices.appendChild(label); return input;
        }
        choices.appendChild(legend);
        const settings = choice('settings', tr('settings', 'Settings and filter rules'));
        const notes = choice('notes', tr('notes', 'Saved video notes'));
        const linkButton = button(tr('linkProfile', 'Link this profile'));
        const pairHelp = make('p', 'ft-auto-sync__help', tr('verifyFirst', 'Connect and verify your other device before linking this profile.'));
        const privateHelp = make('p', 'ft-auto-sync__help', tr('privateData', 'PINs, device permissions and profile ownership stay local.'));
        personalForm.append(choices, linkButton, pairHelp);
        personalSection.append(personalHeading, personalHelp, personalList, linkAnother, personalForm);

        const footer = make('div', 'ft-auto-sync__footer');
        const directHelp = make('p', 'ft-auto-sync__help', tr('direct', 'Direct between your devices while both Accounts & Sync pages are open and connected. Offline changes wait here.'));
        const how = make('details', 'ft-auto-sync__how'); how.open = false;
        const howSummary = make('summary', '', tr('how', 'How Auto-sync works'));
        const deliveryHelp = make('p', 'ft-auto-sync__help', tr('delivery', 'Keep Accounts & Sync open for direct peer-to-peer connections. Optional pickup services provide a separate delivery path for queued parent updates.'));
        const checkButton = button(tr('checkNow', 'Check now'));
        const actionStatus = make('p', 'ft-auto-sync__action-status'); actionStatus.setAttribute('aria-live', 'polite'); actionStatus.setAttribute('aria-atomic', 'true');
        how.append(howSummary, deliveryHelp, notice, privateHelp, checkButton);
        footer.append(directHelp, how);
        panel.append(heading, intro, managedSection, personalSection, footer, actionStatus);
        root.appendChild(panel);
        let disposed = false, busy = false, requestNumber = 0, lastContext = '', addPersonalOpen = false, statusError = false;
        let model = { managed: [], personal: [], canPairPersonal: false }, unsubscribe = null;
        const managedOptions = new Map(), personalNodes = new Map();
        const str = value => typeof value === 'string' ? value : '';
        const currentManaged = () => model.managed.find(row => row.id === managedSelect.value);
        function hide(node, hidden, fallback = heading) {
            if (hidden && node.contains(document.activeElement)) fallback.focus();
            node.hidden = hidden;
        }
        function layout() {
            const managedCount = model.managed.length, personalCount = model.personal.length;
            const empty = !managedCount && !personalCount && !model.canPairPersonal;
            panel.className = 'ft-auto-sync' + (empty ? ' ft-auto-sync--empty' : '');
            setText(intro, empty ? tr('empty', 'Add a device, verify it, then choose what to sync.')
                : tr('intro', 'Choose what to keep up to date.'));
            hide(managedSection, managedCount === 0);
            managedHelp.hidden = true;
            hide(managedLabel, managedCount < 2);
            hide(managedSelect, managedCount < 2);
            managedSingle.hidden = managedCount !== 1;
            setText(managedSingle, managedCount === 1 ? str(model.managed[0].label) : '');
            hide(personalSection, personalCount === 0 && !model.canPairPersonal);
            setText(personalHeading, personalCount ? tr('personalDevices', 'Your synced profiles') : tr('thisProfile', 'Sync this profile'));
            personalHelp.hidden = personalCount > 0;
            personalList.hidden = personalCount === 0;
            hide(linkAnother, personalCount === 0, personalHeading);
            linkAnother.setAttribute('aria-expanded', addPersonalOpen ? 'true' : 'false');
            hide(personalForm, personalCount ? !addPersonalOpen : !model.canPairPersonal, personalSection.hidden ? heading : personalHeading);
            hide(choices, !model.canPairPersonal, personalHeading);
            hide(linkButton, !model.canPairPersonal, personalHeading);
            pairHelp.hidden = model.canPairPersonal;
            hide(footer, empty);
            actionStatus.hidden = empty && !statusError;
        }
        function actionDisabled(node, unavailable) {
            // Keep a pressed button focusable while its asynchronous action runs.
            if (unavailable && document.activeElement === node) heading.focus();
            node.disabled = unavailable;
            node.setAttribute('aria-disabled', unavailable || busy ? 'true' : 'false');
        }
        function stateControls() {
            layout();
            const selected = currentManaged();
            managedSelect.disabled = model.managed.length === 0;
            actionDisabled(managedToggle, !selected || typeof controller.setManaged !== 'function'
                || (!selected.enabled && selected.available === false));
            setText(managedToggle, tr(selected?.enabled ? 'turnOff' : 'turnOn', selected?.enabled ? 'Turn off Auto-sync' : 'Turn on Auto-sync'));
            managedToggle.setAttribute('aria-label', selected ? tr(selected.enabled ? 'turnOffFor' : 'turnOnFor',
                selected.enabled ? 'Turn off Auto-sync for {profile}' : 'Turn on Auto-sync for {profile}', { profile: selected.label }) : tr('turnOn', 'Turn on Auto-sync'));
            setText(managedDetail, selected ? str(selected.detail) + ((!selected.enabled && selected.available === false)
                ? ' ' + tr('reviewConnection', 'Review this verified profile connection before turning on Auto-sync.') : '')
                : tr('noConnectionSelected', 'Choose a verified child-profile connection to change Auto-sync.'));
            setText(managedStatus, selected ? str(selected.status) : '');
            choices.disabled = busy || !model.canPairPersonal;
            settings.disabled = notes.disabled = choices.disabled;
            actionDisabled(linkButton, !model.canPairPersonal || (!settings.checked && !notes.checked) || typeof controller.requestPersonal !== 'function');
            pairHelp.hidden = model.canPairPersonal;
            actionDisabled(checkButton, typeof controller.run !== 'function');
            for (const row of personalNodes.values()) {
                actionDisabled(row.stop, typeof controller.disablePersonal !== 'function');
                actionDisabled(row.keepLocal, typeof controller.resolvePersonal !== 'function');
                actionDisabled(row.useRemote, typeof controller.resolvePersonal !== 'function');
            }
            panel.setAttribute('aria-busy', busy ? 'true' : 'false');
        }
        function render(next) {
            statusError = false;
            model = {
                managed: Array.isArray(next?.managed) ? next.managed.filter(row => typeof row?.id === 'string') : [],
                personal: Array.isArray(next?.personal) ? next.personal.filter(row => typeof row?.id === 'string') : [],
                canPairPersonal: next?.canPairPersonal === true
            };
            setText(notice, str(next?.notice)); notice.hidden = !notice.textContent;
            const oldSelection = managedSelect.value;
            const ids = new Set(model.managed.map(row => row.id));
            for (const [id, option] of managedOptions) if (!ids.has(id)) { option.remove(); managedOptions.delete(id); }
            for (const row of model.managed) {
                let option = managedOptions.get(row.id);
                if (!option) { option = make('option'); option.value = row.id; managedOptions.set(row.id, option); managedSelect.appendChild(option); }
                setText(option, str(row.label));
            }
            const scope = typeof context === 'function' ? context() : context;
            const selectedContext = typeof scope === 'string' ? scope : str(scope?.selectedLinkId || scope?.selectedLink?.linkId || scope?.selectedLink?.id);
            if (selectedContext && selectedContext !== lastContext && ids.has(selectedContext)) managedSelect.value = selectedContext;
            else if (ids.has(oldSelection)) managedSelect.value = oldSelection;
            else managedSelect.value = model.managed.length === 1 ? model.managed[0].id : '';
            lastContext = selectedContext;
            const personalIds = new Set(model.personal.map(row => row.id));
            for (const [id, nodes] of personalNodes) if (!personalIds.has(id)) {
                const ownedFocus = nodes.item.contains(document.activeElement);
                nodes.item.remove(); personalNodes.delete(id);
                if (ownedFocus) personalHeading.focus();
            }
            for (const row of model.personal) {
                let nodes = personalNodes.get(row.id);
                if (!nodes) {
                    const item = make('li', 'ft-auto-sync__link');
                    const body = make('div', 'ft-auto-sync__link-body');
                    const label = make('strong'), detail = make('p', 'ft-auto-sync__detail'), status = make('p', 'ft-auto-sync__status');
                    status.setAttribute('aria-live', 'polite'); status.setAttribute('aria-atomic', 'true');
                    const stop = button(tr('stopSyncing', 'Stop syncing'));
                    stop.addEventListener('click', () => perform(() => controller.disablePersonal(row.id), tr('stopped', 'Auto-sync stopped for this profile link.')));
                    const conflict = make('details', 'ft-auto-sync__conflict');
                    const conflictSummary = make('summary', '', tr('settingsConflict', 'Review settings conflict'));
                    const conflictHelp = make('p', 'ft-auto-sync__help', tr('conflictHelp', 'Settings changed on both devices. Choose which device’s settings to keep. You will review the choice before it is applied.'));
                    const conflictActions = make('div', 'ft-auto-sync__conflict-actions');
                    const keepLocal = button(tr('keepLocal', 'Keep this device'));
                    const useRemote = button(tr('useRemote', 'Use other device'));
                    const resolved = tr('conflictResolved', 'Conflict decision saved. Check this profile’s update status.');
                    keepLocal.addEventListener('click', () => perform(() => controller.resolvePersonal(row.id, 'local'), resolved));
                    useRemote.addEventListener('click', () => perform(() => controller.resolvePersonal(row.id, 'remote'), resolved));
                    conflictActions.append(keepLocal, useRemote); conflict.append(conflictSummary, conflictHelp, conflictActions);
                    body.append(label, detail, status, conflict); item.append(body, stop); personalList.appendChild(item);
                    nodes = { item, label, detail, status, stop, conflict, keepLocal, useRemote }; personalNodes.set(row.id, nodes);
                }
                setText(nodes.label, str(row.label)); setText(nodes.detail, str(row.detail)); setText(nodes.status, str(row.status));
                nodes.stop.setAttribute('aria-label', tr('stopFor', 'Stop syncing {profile}', { profile: str(row.label) }));
                const showConflict = row.needsReview === true;
                if (!showConflict && nodes.conflict.contains(document.activeElement)) nodes.stop.focus();
                nodes.conflict.hidden = !showConflict;
            }
            stateControls();
        }
        async function refresh() {
            const request = ++requestNumber;
            try {
                const next = await controller.view();
                if (!disposed && request === requestNumber) { render(next); return true; }
                return null;
            } catch (_) {
                if (!disposed && request === requestNumber) {
                    statusError = true;
                    setText(actionStatus, tr('unavailable', 'Auto-sync status is unavailable. Check again before changing this connection.'));
                    actionStatus.hidden = false;
                }
                return false;
            }
        }
        async function perform(operation, success) {
            if (busy || disposed) return;
            busy = true; statusError = false; stateControls(); setText(actionStatus, tr('working', 'Checking Auto-sync…'));
            try {
                const result = await operation();
                if (result === false || result?.ok === false) throw Error('autosync_action_not_completed');
                if (disposed) return;
                if (await refresh() === true) setText(actionStatus, success);
            } catch (_) {
                if (!disposed) {
                    statusError = true;
                    setText(actionStatus, tr('actionFailed', 'Could not confirm the Auto-sync change. Check the connection and profile permissions, then try again.'));
                }
            } finally {
                busy = false; if (!disposed) stateControls();
            }
        }
        managedSelect.addEventListener('change', stateControls);
        linkAnother.addEventListener('click', () => { addPersonalOpen = !addPersonalOpen; layout(); });
        managedToggle.addEventListener('click', () => {
            const selected = currentManaged();
            if (selected) return perform(() => controller.setManaged(selected.id, !selected.enabled), tr('saved', 'Auto-sync preference saved.'));
        });
        for (const input of [settings, notes]) input.addEventListener('change', stateControls);
        linkButton.addEventListener('click', () => {
            const selected = { settings: settings.checked, notes: notes.checked };
            if (!model.canPairPersonal || (!selected.settings && !selected.notes)) return;
            return perform(async () => {
                const result = await controller.requestPersonal(selected);
                if (result !== false && result?.ok !== false) {
                    settings.checked = false; notes.checked = false;
                    if (document.activeElement === linkButton) personalHeading.focus();
                }
                return result;
            }, tr('approvalRequested', 'Link request sent. The other device must approve before Auto-sync starts.'));
        });
        checkButton.addEventListener('click', () => perform(() => controller.run(), tr('checked', 'Device check finished. See each profile’s update status.')));
        if (typeof controller.subscribe === 'function') unsubscribe = controller.subscribe(() => { if (!disposed) void refresh(); });
        stateControls();
        const ready = refresh();
        function dispose() { disposed = true; requestNumber++; if (typeof unsubscribe === 'function') unsubscribe(); panel.remove(); }
        return Object.freeze({ ready, refresh, dispose });
    }
    return Object.freeze({ install });
}));
