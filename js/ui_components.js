/**
 * FilterTube UI Components Library
 * Centralized, reusable UI components (React-like approach)
 */

const UIComponents = (() => {
    'use strict';

    // ============================================================================
    // THEME & COLORS
    // ============================================================================
    const Colors = {
        brandPrimary: '#C0392B',
        brandSecondary: '#2F7A63',
        statusSuccess: '#2F7A63',
        statusDanger: '#B44339',
        textPrimary: '#1A1A1A',
        textSecondary: '#595959',
        textMuted: '#8C8C8C',
        borderNeutral: '#E0E0E0',
        bgBase: '#F9F8F6',
        bgSurface: '#FFFFFF',
        bgPanel: '#F0EFEA'
    };

    // ============================================================================
    // BUTTONS
    // ============================================================================

    /**
     * Create a primary button
     * @param {Object} options - Button options
     * @param {string} options.text - Button text
     * @param {Function} options.onClick - Click handler
     * @param {string} options.id - Optional ID
     * @param {string} options.className - Additional classes
     * @param {boolean} options.small - Use small size
     * @returns {HTMLButtonElement}
     */
    function createButton({ text, onClick, id, className = '', small = false }) {
        const btn = document.createElement('button');
        btn.className = `btn-primary ${small ? 'btn-small' : ''} ${className}`.trim();
        btn.textContent = text;
        if (id) btn.id = id;
        if (onClick) btn.addEventListener('click', onClick);
        return btn;
    }

    /**
     * Flash a button with success feedback
     * @param {HTMLButtonElement} button - Button element
     * @param {string} successText - Text to show on success (default: "Saved!")
     * @param {number} duration - Duration in ms (default: 1500)
     */
    function flashButtonSuccess(button, successText = 'Saved!', duration = 1500) {
        if (!button) return;

        const originalText = button.textContent;
        const originalBg = button.style.backgroundColor;
        const originalColor = button.style.color;
        const originalBorder = button.style.borderColor;

        button.textContent = successText;
        button.style.backgroundColor = Colors.statusSuccess;
        button.style.color = 'white';
        button.style.borderColor = Colors.statusSuccess;
        button.classList.add('btn-success-flash');

        setTimeout(() => {
            button.textContent = originalText;
            button.style.backgroundColor = originalBg;
            button.style.color = originalColor;
            button.style.borderColor = originalBorder;
            button.classList.remove('btn-success-flash');
        }, duration);
    }

    /**
     * Create a toggle button (like Exact)
     * @param {Object} options - Toggle options
     * @param {string} options.text - Button text
     * @param {boolean} options.active - Initial active state
     * @param {Function} options.onToggle - Toggle handler
     * @param {string} options.className - Additional classes
     * @returns {HTMLElement}
     */
    function createToggleButton({ text, active = false, onToggle, className = '' }) {
        const toggle = document.createElement('div');
        toggle.className = `exact-toggle ${active ? 'active' : ''} ${className}`.trim();
        toggle.textContent = text;
        toggle.setAttribute('role', 'button');
        toggle.setAttribute('aria-pressed', active);
        toggle.setAttribute('tabindex', '0');

        toggle.addEventListener('click', () => {
            const newState = !toggle.classList.contains('active');
            toggle.classList.toggle('active');
            toggle.setAttribute('aria-pressed', newState);
            if (onToggle) onToggle(newState);
        });

        // Keyboard accessibility
        toggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle.click();
            }
        });

        return toggle;
    }

    /**
     * Create a delete button
     * @param {Function} onClick - Click handler
     * @returns {HTMLButtonElement}
     */
    function createDeleteButton(onClick) {
        const btn = document.createElement('button');
        btn.className = 'delete-btn';
        btn.setAttribute('aria-label', 'Delete');
        btn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        `;
        if (onClick) btn.addEventListener('click', onClick);
        return btn;
    }

    // ============================================================================
    // INPUTS
    // ============================================================================

    /**
     * Create a text input
     * @param {Object} options - Input options
     * @param {string} options.placeholder - Placeholder text
     * @param {string} options.value - Initial value
     * @param {Function} options.onInput - Input handler
     * @param {Function} options.onEnter - Enter key handler
     * @param {string} options.id - Optional ID
     * @param {string} options.className - Additional classes
     * @returns {HTMLInputElement}
     */
    function createInput({ placeholder = '', value = '', onInput, onEnter, id, className = '' }) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = `text-input ${className}`.trim();
        input.placeholder = placeholder;
        input.value = value;
        if (id) input.id = id;

        if (onInput) {
            input.addEventListener('input', (e) => onInput(e.target.value));
        }

        if (onEnter) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') onEnter();
            });
        }

        return input;
    }

    /**
     * Create a search input
     * @param {Object} options - Search input options
     * @param {string} options.placeholder - Placeholder text
     * @param {Function} options.onSearch - Search handler (receives search term)
     * @param {string} options.id - Optional ID
     * @returns {HTMLInputElement}
     */
    function createSearchInput({ placeholder = 'Search...', onSearch, id }) {
        const input = createInput({
            placeholder,
            id,
            className: 'search-input',
            onInput: onSearch
        });
        return input;
    }

    // ============================================================================
    // TABS
    // ============================================================================

    /**
     * Create a tabbed interface
     * @param {Object} options - Tab options
     * @param {Array} options.tabs - Array of {id, label, content}
     * @param {string} options.defaultTab - Default active tab ID
     * @param {Function} options.onTabChange - Tab change handler
     * @returns {Object} - {container, switchTab, getCurrentTab}
     */
    function createTabs({ tabs, defaultTab, onTabChange }) {
        const container = document.createElement('div');
        container.className = 'tabs-container';

        // Tab buttons
        const tabButtons = document.createElement('div');
        tabButtons.className = 'tab-buttons';

        // Tab content area
        const tabContent = document.createElement('div');
        tabContent.className = 'tab-content';

        let currentTab = defaultTab || tabs[0]?.id;

        tabs.forEach(tab => {
            // Create button
            const btn = document.createElement('button');
            btn.className = `tab-button ${tab.id === currentTab ? 'active' : ''}`;
            btn.innerHTML = tab.label;
            btn.setAttribute('data-tab-id', tab.id);
            btn.setAttribute('role', 'tab');
            btn.setAttribute('aria-selected', tab.id === currentTab);

            btn.addEventListener('click', () => switchTab(tab.id));

            tabButtons.appendChild(btn);

            // Create content wrapper
            const contentWrapper = document.createElement('div');
            contentWrapper.className = `tab-pane ${tab.id === currentTab ? 'active' : ''}`;
            contentWrapper.setAttribute('data-tab-id', tab.id);
            contentWrapper.setAttribute('role', 'tabpanel');

            if (typeof tab.content === 'string') {
                contentWrapper.innerHTML = tab.content;
            } else if (tab.content instanceof HTMLElement) {
                contentWrapper.appendChild(tab.content);
            }

            tabContent.appendChild(contentWrapper);
        });

        function switchTab(tabId) {
            // Update buttons
            tabButtons.querySelectorAll('.tab-button').forEach(btn => {
                const isActive = btn.getAttribute('data-tab-id') === tabId;
                btn.classList.toggle('active', isActive);
                btn.setAttribute('aria-selected', isActive);
            });

            // Update content
            tabContent.querySelectorAll('.tab-pane').forEach(pane => {
                const isActive = pane.getAttribute('data-tab-id') === tabId;
                pane.classList.toggle('active', isActive);
            });

            currentTab = tabId;
            if (onTabChange) onTabChange(tabId);
        }

        function getCurrentTab() {
            return currentTab;
        }

        container.appendChild(tabButtons);
        container.appendChild(tabContent);

        return {
            container,
            switchTab,
            getCurrentTab
        };
    }

    // ============================================================================
    // LISTS & CARDS
    // ============================================================================

    /**
     * Create a list item for keywords/channels
     * @param {Object} options - List item options
     * @param {string} options.text - Item text
     * @param {boolean} options.exact - Exact match state (for keywords)
     * @param {Function} options.onToggleExact - Exact toggle handler
     * @param {Function} options.onDelete - Delete handler
     * @returns {HTMLElement}
     */
    function createListItem({ text, exact, onToggleExact, onDelete }) {
        const item = document.createElement('div');
        item.className = 'list-item';

        const textSpan = document.createElement('span');
        textSpan.className = 'item-word';
        textSpan.textContent = text;

        const controls = document.createElement('div');
        controls.className = 'item-controls';

        // Add exact toggle if handler provided
        if (typeof onToggleExact === 'function') {
            const exactToggle = createToggleButton({
                text: 'Exact',
                active: exact || false,
                onToggle: onToggleExact
            });
            controls.appendChild(exactToggle);
        }

        // Add delete button
        const deleteBtn = createDeleteButton(onDelete);
        controls.appendChild(deleteBtn);

        item.appendChild(textSpan);
        item.appendChild(controls);

        return item;
    }

    /**
     * Create an empty state message
     * @param {string} message - Message to display
     * @returns {HTMLElement}
     */
    function createEmptyState(message) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.textContent = message;
        return empty;
    }

    // ============================================================================
    // UTILITIES
    // ============================================================================

    /**
     * Show a toast notification
     * @param {string} message - Toast message
     * @param {string} type - Toast type: 'success', 'error', 'info'
     * @param {number} duration - Duration in ms (default: 3000)
     */
    function showToast(message, type = 'info', duration = 3000) {
        // Remove existing toasts
        document.querySelectorAll('.ft-toast').forEach(t => t.remove());

        const toast = document.createElement('div');
        toast.className = `ft-toast ft-toast-${type}`;
        toast.textContent = message;

        document.body.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // ============================================================================
    // PUBLIC API
    // ============================================================================

    return {
        Colors,
        createButton,
        flashButtonSuccess,
        createToggleButton,
        createDeleteButton,
        createInput,
        createSearchInput,
        createTabs,
        createListItem,
        createEmptyState,
        showToast
    };
})();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIComponents;
}
