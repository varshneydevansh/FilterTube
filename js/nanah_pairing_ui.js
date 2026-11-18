/* Presentation only: connection and profile controllers retain all authorization. */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.FilterTubeNanahPairingUI = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    function phase(state) {
        if (state.active !== true) return 'connect';
        if (state.phrase && state.phraseConfirmed !== true) return 'verify';
        if (state.connected === true && state.phraseConfirmed === true) return 'share';
        return 'waiting';
    }
    // Kriti thinks while the other device is on its way (the app's still, no motion or sound, as on
    // StudyFamilyUi and AskParentUi); never on the safety-phrase check. Decoration: aria-hidden.
    function syncThinking(root, find, waiting) {
        const existing = root.querySelector('[data-ft-pairing-thinking]');
        const anchor = find('ftNanahPairCodeRow');
        const mascots = root.ownerDocument?.defaultView?.FilterTubeMascots;
        if (!waiting || !anchor?.parentNode || typeof mascots?.moment !== 'function') {
            existing?.remove();
            return;
        }
        if (existing) return;
        const pose = mascots.moment('thinking', { height: 72 });
        if (!pose) return;
        pose.setAttribute('data-ft-pairing-thinking', '');
        pose.setAttribute('aria-hidden', 'true');
        pose.classList.add('pk-pairing-thinking');
        anchor.parentNode.insertBefore(pose, anchor);
    }
    function render({ root, state = {}, previouslyFocused = null } = {}) {
        if (!root?.querySelector) return;
        const find = id => root.querySelector(`#${id}`);
        const currentPhase = phase(state);
        const connect = currentPhase === 'connect', ready = currentPhase === 'share';
        const currentFocus = root.ownerDocument?.activeElement;
        const activeElement = currentFocus && root.contains(currentFocus) ? currentFocus : previouslyFocused;
        const hide = (id, hidden) => {
            const node = find(id);
            if (node && node.hidden !== hidden) node.hidden = hidden;
        };
        root.dataset.pairingPhase = currentPhase;
        syncThinking(root, find, currentPhase === 'waiting');
        hide('ftNanahPurposeChooser', !connect || state.childReceiveOnly === true);
        hide('ftNanahPurposeDetails', !connect || state.childReceiveOnly === true);
        hide('ftNanahReceiverInstruction', !connect || state.mode !== 'parent_control' || state.childReceiveOnly === true);
        hide('ftNanahDeviceNameDetails', !connect);
        hide('ftNanahFamilyShortcuts', !connect || state.childReceiveOnly === true);
        hide('ftNanahAdvancedDetails', false);
        hide('ftNanahHostBtn', !connect || state.canHost !== true);
        hide('ftNanahJoinControls', !connect);
        hide('ftNanahSendBtn', !ready || state.canSend !== true);
        hide('ftNanahTrustBtn', !ready || state.canTrust !== true);
        hide('ftNanahEndSessionBtn', state.active !== true);
        hide('ftNanahManagedTargetsField', !ready || state.managedTargetsVisible !== true || state.childReceiveOnly === true);
        hide('ftNanahRemoteTargetField', !ready || state.targetVisible !== true || state.childReceiveOnly === true);
        hide('ftNanahSendTransferSummary', !ready || state.canSend !== true || !find('ftNanahSendTransferSummary')?.textContent.trim());
        hide('ftNanahRemoteEndpointRow', state.connected !== true);
        hide('ftNanahPhraseRow', !state.phrase);
        hide('ftNanahConfirmSasBtn', currentPhase !== 'verify');
        hide('ftNanahPairCodeRow', state.active !== true || !state.code || state.connected === true);
        hide('ftNanahPairUriRow', state.active !== true || !state.pairUri || state.connected === true);
        hide('ftNanahQrWrap', state.active !== true || !state.pairUri || state.connected === true || state.hasQrRenderer !== true);
        hide('ftNanahSavedLinksDetails', !Number.isInteger(state.savedLinkCount) || state.savedLinkCount < 1);
        // The scanner owns its own hidden state and must remain visible until its lifecycle closes it.
        // Return D-pad/keyboard focus only when this render has hidden the currently focused area.
        if (activeElement && root.contains(activeElement)) {
            let hidden = false;
            for (let node = activeElement; node && node !== root; node = node.parentElement) hidden ||= node.hidden === true;
            if (hidden) {
                const nextId = currentPhase === 'verify' ? 'ftNanahConfirmSasBtn'
                    : ready && state.canSend === true ? 'ftNanahSendBtn'
                        : currentPhase === 'waiting' && state.code && state.connected !== true ? 'ftNanahPairCode'
                            : connect && state.canHost === true ? 'ftNanahHostBtn'
                                : connect ? 'ftNanahJoinCode' : 'ftNanahStage';
                const next = find(nextId);
                if (next && !next.disabled) {
                    if (!/^(BUTTON|INPUT|SELECT|TEXTAREA|A)$/.test(next.tagName)) next.tabIndex = -1;
                    next.focus({ preventScroll: true });
                }
            }
        }
        return currentPhase;
    }
    return Object.freeze({ phase, render });
});
