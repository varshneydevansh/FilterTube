/**
 * Popup script for FilterTube extension
 * 
 * This script handles the settings popup UI for FilterTube
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get references to DOM elements
    const keywordsElement = document.getElementById('keywords');
    const channelsElement = document.getElementById('channels');
    const saveButton = document.getElementById('saveBtn');
    const openInTabButton = document.getElementById('openInTabBtn');
    const hideAllCommentsCheckbox = document.getElementById('hideAllComments');
    const hideFilteredCommentsCheckbox = document.getElementById('hideFilteredComments');

    // Make sure required elements exist
    if (!keywordsElement || !channelsElement || !saveButton) {
        console.error('FilterTube: Required DOM elements not found');
        return;
    }

    // Load settings from storage
    loadSettings();

    // Set up checkbox exclusivity
    if (hideAllCommentsCheckbox && hideFilteredCommentsCheckbox) {
        setupCommentFilterExclusivity();
    }

    // Set up button event listeners
    saveButton.addEventListener('click', saveSettings);
    
    // Add the open-in-tab button listener if it exists
    if (openInTabButton) {
        openInTabButton.addEventListener('click', openInNewTab);
    }

    /**
     * Loads settings from storage
     */
    function loadSettings() {
        chrome.storage.local.get([
            'filterKeywords', 
            'filterChannels', 
            'hideAllComments', 
            'hideFilteredComments'
        ], function(items) {
            // Set form values
            keywordsElement.value = items.filterKeywords || '';
            channelsElement.value = items.filterChannels || '';
            
            if (hideAllCommentsCheckbox && hideFilteredCommentsCheckbox) {
                hideAllCommentsCheckbox.checked = items.hideAllComments || false;
                hideFilteredCommentsCheckbox.checked = items.hideFilteredComments || false;
                
                // Ensure only one is checked
                if (hideAllCommentsCheckbox.checked && hideFilteredCommentsCheckbox.checked) {
                    hideFilteredCommentsCheckbox.checked = false;
                }
            }
        });
    }

    /**
     * Sets up mutual exclusivity for comment filtering checkboxes
     */
    function setupCommentFilterExclusivity() {
        hideAllCommentsCheckbox.addEventListener('change', function() {
            if (this.checked) {
                hideFilteredCommentsCheckbox.checked = false;
            }
        });
        
        hideFilteredCommentsCheckbox.addEventListener('change', function() {
            if (this.checked) {
                hideAllCommentsCheckbox.checked = false;
            }
        });
    }

    /**
     * Saves settings to storage
     */
    function saveSettings() {
        // Get current values
        const filterKeywords = keywordsElement.value.trim();
        const filterChannels = channelsElement.value.trim();
        const hideAllComments = hideAllCommentsCheckbox ? hideAllCommentsCheckbox.checked : false;
        const hideFilteredComments = hideFilteredCommentsCheckbox ? hideFilteredCommentsCheckbox.checked : false;
        
        // Visual feedback - change button appearance
        const originalButtonText = saveButton.textContent;
        saveButton.classList.add('saved');
        saveButton.textContent = 'Saved!';
        
        // Save to storage
        chrome.storage.local.set({
            filterKeywords: filterKeywords,
            filterChannels: filterChannels,
            hideAllComments: hideAllComments,
            hideFilteredComments: hideFilteredComments
        }, function() {
            // Reset button after delay
            setTimeout(function() {
                saveButton.classList.remove('saved');
                saveButton.textContent = originalButtonText;
            }, 1500);
        });
    }

    /**
     * Opens the extension in a new tab
     */
    function openInNewTab() {
        console.log('Opening FilterTube in new tab');
        
        // First try to open our website directly
        chrome.tabs.create({
            url: 'https://varshneydevansh.github.io/FilterTube/website/'
        }, (tab) => {
            // If successful, we're done
            console.log('Opened FilterTube website');
        });
        
        // Fallback to the tab view if website isn't available
        chrome.runtime.openOptionsPage || chrome.tabs.create({
            url: chrome.runtime.getURL('html/tab-view.html')
        }, (tab) => {
            console.log('Opened FilterTube tab view (fallback)');
        });
    }
});
