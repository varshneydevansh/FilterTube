// Shows a one-time prompt after initial install on YouTube asking the user to refresh.
(function () {
    const api = (typeof browserAPI_BRIDGE !== 'undefined' && browserAPI_BRIDGE.runtime)
        ? browserAPI_BRIDGE
        : (typeof browser !== 'undefined' ? browser : (typeof chrome !== 'undefined' ? chrome : null));
    if (!api || !api.runtime) return;

    const PROMPT_ID = 'ft-first-run-refresh-prompt';
    let dismissed = false;

    function getPalette() {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            return {
                surface: '#0f1721',
                border: 'rgba(255,255,255,0.08)',
                text: '#e9f4ff',
                subtext: '#cdd9e4',
                badgeBg: 'rgba(29,187,127,0.16)',
                badgeBorder: 'rgba(124,242,189,0.35)',
                badgeText: '#7cf2bd',
                btnBg: '#1dbb7f',
                btnText: '#062014',
                btnShadow: '0 6px 18px rgba(29,187,127,0.35)',
                outline: '1px solid rgba(255,255,255,0.16)'
            };
        }
        return {
            surface: '#ffffff',
            border: '#e6edf5',
            text: '#0b1a26',
            subtext: '#35485a',
            badgeBg: 'rgba(29,187,127,0.12)',
            badgeBorder: 'rgba(29,187,127,0.28)',
            badgeText: '#0f7a52',
            btnBg: '#1dbb7f',
            btnText: '#062014',
            btnShadow: '0 8px 20px rgba(29,187,127,0.28)',
            outline: '1px solid #d3deea'
        };
    }

    function createPrompt() {
        if (dismissed) return;
        if (document.getElementById(PROMPT_ID)) return;

        const palette = getPalette();

        const container = document.createElement('div');
        container.id = PROMPT_ID;
        container.style.position = 'fixed';
        container.style.zIndex = '2147483647';
        container.style.top = '16px';
        container.style.right = '16px';
        container.style.maxWidth = '340px';
        container.style.background = palette.surface;
        container.style.color = palette.text;
        container.style.boxShadow = '0 10px 30px rgba(0,0,0,0.24)';
        container.style.borderRadius = '14px';
        container.style.padding = '14px 16px';
        container.style.fontSize = '14px';
        container.style.lineHeight = '1.5';
        container.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        container.style.border = palette.border;
        container.style.backdropFilter = 'blur(8px)';

        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.gap = '10px';
        header.style.marginBottom = '8px';

        const badge = document.createElement('div');
        badge.textContent = 'FilterTube';
        badge.style.background = palette.badgeBg;
        badge.style.color = palette.badgeText;
        badge.style.fontWeight = '700';
        badge.style.fontSize = '11px';
        badge.style.letterSpacing = '0.4px';
        badge.style.padding = '4px 8px';
        badge.style.borderRadius = '999px';
        badge.style.border = palette.badgeBorder;

        header.appendChild(badge);

        const title = document.createElement('div');
        title.style.fontWeight = '800';
        title.style.fontSize = '15px';
        title.textContent = 'Refresh to activate';
        header.appendChild(title);

        const desc = document.createElement('div');
        desc.style.marginBottom = '12px';
        desc.style.color = palette.subtext;
        desc.textContent = 'FilterTube is ready. Refresh this YouTube tab once to start filtering.';

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '8px';
        actions.style.flexWrap = 'wrap';

        const refreshBtn = document.createElement('button');
        refreshBtn.textContent = 'Refresh now';
        refreshBtn.style.flex = '1 1 auto';
        refreshBtn.style.background = palette.btnBg;
        refreshBtn.style.color = palette.btnText;
        refreshBtn.style.border = '1px solid rgba(0,0,0,0.08)';
        refreshBtn.style.borderRadius = '10px';
        refreshBtn.style.padding = '10px 12px';
        refreshBtn.style.fontWeight = '800';
        refreshBtn.style.cursor = 'pointer';
        refreshBtn.style.boxShadow = palette.btnShadow;
        refreshBtn.onclick = () => {
            markComplete();
            window.location.reload();
        };

        const dismissBtn = document.createElement('button');
        dismissBtn.textContent = 'Not now';
        dismissBtn.style.flex = '0 0 auto';
        dismissBtn.style.background = 'transparent';
        dismissBtn.style.color = palette.subtext;
        dismissBtn.style.border = palette.outline;
        dismissBtn.style.borderRadius = '10px';
        dismissBtn.style.padding = '10px 12px';
        dismissBtn.style.cursor = 'pointer';
        dismissBtn.onclick = () => {
            markComplete();
            container.remove();
        };

        actions.appendChild(refreshBtn);
        actions.appendChild(dismissBtn);

        container.appendChild(header);
        container.appendChild(desc);
        container.appendChild(actions);

        document.body.appendChild(container);
    }

    function markComplete() {
        dismissed = true;
        api.runtime.sendMessage({ action: 'FilterTube_FirstRunComplete' });
    }

    function init() {
        api.runtime.sendMessage({ action: 'FilterTube_FirstRunCheck' }, (resp) => {
            if (resp && resp.needed) {
                if (document.readyState === 'complete' || document.readyState === 'interactive') {
                    createPrompt();
                } else {
                    document.addEventListener('DOMContentLoaded', createPrompt, { once: true });
                }
            }
        });
    }

    init();
})();
