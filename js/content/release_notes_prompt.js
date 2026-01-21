/**
 * Release Notes Prompt (content script)
 *
 * Injected on youtube.com/youtubekids.com to surface a one-time banner when the
 * installed extension version has unseen release notes. The heavy lifting of
 * fetching/saving payloads happens in the background script; this file only
 * handles presentation + UX.
 */
(function releaseNotesPrompt() {
    const api = (typeof browserAPI_BRIDGE !== 'undefined' && browserAPI_BRIDGE.runtime)
        ? browserAPI_BRIDGE
        : (typeof browser !== 'undefined' ? browser : (typeof chrome !== 'undefined' ? chrome : null));

    if (!api || !api.runtime) return;

    const PROMPT_ID = 'ft-release-notes-banner';
    const WHATS_NEW_URL = (api.runtime && typeof api.runtime.getURL === 'function')
        ? api.runtime.getURL('html/tab-view.html?view=whatsnew')
        : null;
    let payloadCache = null;
    let dismissed = false;

    /**
     * Picks light/dark palette tokens dynamically so the floating card matches
     * YouTube’s current theme.
     */
    function getPalette() {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            return {
                surface: '#1E1E1E',
                border: 'rgba(255,255,255,0.12)',
                text: '#F5F5F5',
                subtext: '#CFCFD0',
                accent: '#C0392B',
                accentSoft: 'rgba(192,57,43,0.25)',
                buttonText: '#FFFFFF',
                secondaryBg: 'rgba(255,255,255,0.08)',
                shadow: '0 16px 40px rgba(0,0,0,0.45)'
            };
        }
        return {
            surface: '#FFFFFF',
            border: 'rgba(0,0,0,0.08)',
            text: '#111827',
            subtext: '#4B5563',
            accent: '#C0392B',
            accentSoft: 'rgba(192,57,43,0.12)',
            buttonText: '#FFFFFF',
            secondaryBg: 'rgba(17,24,39,0.04)',
            shadow: '0 18px 46px rgba(15,23,36,0.14)'
        };
    }

    /**
     * Gracefully fades the banner away before removing it from the DOM.
     */
    function removePrompt() {
        const existing = document.getElementById(PROMPT_ID);
        if (existing) {
            existing.classList.add('ft-release-notes-closing');
            setTimeout(() => existing.remove(), 180);
        }
    }

    /**
     * Tells the background script that the current version has been seen so we
     * don’t keep re-rendering the prompt on every navigation, then removes UI.
     */
    function ackAndDismiss() {
        if (!payloadCache?.version) {
            removePrompt();
            return;
        }
        api.runtime.sendMessage({
            action: 'FilterTube_ReleaseNotesAck',
            version: payloadCache.version
        }, () => {
            removePrompt();
            dismissed = true;
        });
    }

    /**
     * Builds the banner DOM using the hydrated payload from the background.
     */
    function createPrompt(payload) {
        if (dismissed) return;
        if (!payload || document.getElementById(PROMPT_ID)) return;

        payloadCache = payload;
        const palette = getPalette();

        const container = document.createElement('section');
        container.id = PROMPT_ID;
        container.setAttribute('role', 'status');
        container.setAttribute('aria-live', 'polite');
        container.style.position = 'fixed';
        container.style.zIndex = '2147483646';
        container.style.top = '16px';
        container.style.right = '16px';
        container.style.maxWidth = '360px';
        container.style.width = 'clamp(280px, 32vw, 360px)';
        container.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        container.style.background = palette.surface;
        container.style.border = `1px solid ${palette.border}`;
        container.style.borderRadius = '16px';
        container.style.boxShadow = palette.shadow;
        container.style.padding = '18px';
        container.style.color = palette.text;
        container.style.lineHeight = '1.4';
        container.style.boxSizing = 'border-box';
        container.style.backdropFilter = 'blur(10px)';
        container.style.animation = 'ft-release-notes-fade-in 220ms ease-out forwards';

        const accentBar = document.createElement('div');
        accentBar.style.height = '4px';
        accentBar.style.width = '48px';
        accentBar.style.borderRadius = '999px';
        accentBar.style.background = `linear-gradient(135deg, ${palette.accent}, ${palette.accentSoft})`;
        accentBar.style.marginBottom = '12px';
        container.appendChild(accentBar);

        const title = document.createElement('div');
        title.textContent = payload.headline || 'FilterTube just updated';
        title.style.fontWeight = '700';
        title.style.fontSize = '16px';
        title.style.letterSpacing = '-0.01em';
        title.style.marginBottom = '8px';
        container.appendChild(title);

        const body = document.createElement('div');
        body.textContent = payload.body || 'See what’s new in the latest release.';
        body.style.fontSize = '14px';
        body.style.color = palette.subtext;
        body.style.marginBottom = '16px';
        container.appendChild(body);

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '8px';
        actions.style.flexWrap = 'wrap';
        actions.style.alignItems = 'center';

        // We always prefer the in-extension What’s New view so blockers/extensions
        // don’t intercept external URLs. Legacy payload links act as fallback.
        const targetLink = WHATS_NEW_URL || payload.link;

        if (targetLink) {
            const learnBtn = document.createElement('button');
            learnBtn.type = 'button';
            learnBtn.textContent = payload.ctaLabel || 'Learn more';
            learnBtn.style.flex = '1 1 auto';
            learnBtn.style.border = 'none';
            learnBtn.style.borderRadius = '999px';
            learnBtn.style.padding = '10px 16px';
            learnBtn.style.fontWeight = '600';
            learnBtn.style.cursor = 'pointer';
            learnBtn.style.background = palette.accent;
            learnBtn.style.color = palette.buttonText;
            learnBtn.style.boxShadow = '0 10px 25px rgba(192,57,43,0.25)';
            learnBtn.onclick = () => {
                // Delegate tab creation to background so chrome-extension:// URLs
                // open in a privileged context (avoids ERR_BLOCKED_BY_CLIENT).
                api.runtime.sendMessage({ action: 'FilterTube_OpenWhatsNew', url: targetLink }, () => {
                    if (api.runtime.lastError) {
                        try {
                            window.open(targetLink, '_blank', 'noopener');
                        } catch (e) {
                            location.href = targetLink;
                        }
                    }
                    ackAndDismiss();
                });
            };
            actions.appendChild(learnBtn);
        }

        const dismissBtn = document.createElement('button');
        dismissBtn.type = 'button';
        dismissBtn.textContent = 'Got it';
        dismissBtn.style.flex = targetLink ? '0 0 auto' : '1 1 auto';
        dismissBtn.style.border = '1px solid ' + palette.border;
        dismissBtn.style.borderRadius = '999px';
        dismissBtn.style.padding = '10px 16px';
        dismissBtn.style.fontWeight = '600';
        dismissBtn.style.cursor = 'pointer';
        dismissBtn.style.background = palette.secondaryBg;
        dismissBtn.style.color = palette.text;
        dismissBtn.onclick = () => ackAndDismiss();
        actions.appendChild(dismissBtn);

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.setAttribute('aria-label', 'Dismiss');
        closeBtn.textContent = '×';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '8px';
        closeBtn.style.right = '10px';
        closeBtn.style.border = 'none';
        closeBtn.style.background = 'transparent';
        closeBtn.style.color = palette.subtext;
        closeBtn.style.fontSize = '18px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.onclick = () => ackAndDismiss();

        container.appendChild(actions);
        container.appendChild(closeBtn);

        const style = document.createElement('style');
        style.textContent = `
            @keyframes ft-release-notes-fade-in {
                from { opacity: 0; transform: translateY(-6px); }
                to { opacity: 1; transform: translateY(0); }
            }
            #${PROMPT_ID}.ft-release-notes-closing {
                opacity: 0;
                transform: translateY(-8px);
                transition: opacity 180ms ease, transform 180ms ease;
            }
            @media (max-width: 600px) {
                #${PROMPT_ID} {
                    left: 12px;
                    right: 12px;
                    width: auto;
                }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(container);
    }

    /**
     * Entry point – asks background if a prompt is needed and renders it.
     */
    function init() {
        api.runtime.sendMessage({ action: 'FilterTube_ReleaseNotesCheck' }, (resp) => {
            if (!resp || !resp.needed || !resp.payload) return;
            const ready = () => createPrompt(resp.payload);
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                ready();
            } else {
                document.addEventListener('DOMContentLoaded', ready, { once: true });
            }
        });
    }

    init();
})();
