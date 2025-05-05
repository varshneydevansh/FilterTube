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
    const logoIcon = document.querySelector('.logo-icon');
    const titleElement = document.querySelector('.title');
    const hideAllCommentsCheckbox = document.getElementById('hideAllComments');
    const filterCommentsCheckbox = document.getElementById('hideFilteredComments');

    // Make sure required elements exist
    if (!keywordsElement || !channelsElement || !saveButton) {
        console.error('FilterTube: Required DOM elements not found');
        return;
    }

    // Load settings from storage
    loadSettings();

    // Set up checkbox exclusivity
    if (hideAllCommentsCheckbox && filterCommentsCheckbox) {
        setupCommentFilterExclusivity();
    }

    // Set up button event listeners
    saveButton.addEventListener('click', saveSettings);
    
    // Add the open-in-tab button listener if it exists
    if (openInTabButton) {
        openInTabButton.addEventListener('click', openInNewTab);
    }
    
    // Make logo and title clickable to go to website
    if (logoIcon) {
        logoIcon.style.cursor = 'pointer';
        logoIcon.addEventListener('click', openWebsite);
    }
    
    if (titleElement) {
        titleElement.style.cursor = 'pointer';
        titleElement.addEventListener('click', openWebsite);
    }

    /**
     * Loads settings from storage
     */
    function loadSettings() {
        chrome.storage.local.get([
            'filterKeywords', 
            'filterChannels', 
            'hideAllComments', 
            'filterComments'
        ], function(items) {
            // Set form values
            keywordsElement.value = items.filterKeywords || '';
            channelsElement.value = items.filterChannels || '';
            
            if (hideAllCommentsCheckbox && filterCommentsCheckbox) {
                hideAllCommentsCheckbox.checked = items.hideAllComments || false;
                filterCommentsCheckbox.checked = items.filterComments || false;
                
                // Ensure only one is checked (hideAllComments takes precedence)
                if (hideAllCommentsCheckbox.checked && filterCommentsCheckbox.checked) {
                    filterCommentsCheckbox.checked = false;
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
                filterCommentsCheckbox.checked = false;
            }
        });
        
        filterCommentsCheckbox.addEventListener('change', function() {
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
        const filterComments = filterCommentsCheckbox ? filterCommentsCheckbox.checked : false;
        
        // Visual feedback - change button appearance
        const originalButtonText = saveButton.textContent;
        saveButton.classList.add('saved');
        saveButton.textContent = 'Saved!';
        
        // Save to storage
        chrome.storage.local.set({
            filterKeywords: filterKeywords,
            filterChannels: filterChannels,
            hideAllComments: hideAllComments,
            filterComments: filterComments
        }, function() {
            // Reset button after delay
            setTimeout(function() {
                saveButton.classList.remove('saved');
                saveButton.textContent = originalButtonText;
            }, 1500);
        });
    }

    /**
     * Opens the settings in a new tab
     */
    function openInNewTab() {
        const extensionUrl = chrome.runtime.getURL('html/tab-view.html');
        chrome.tabs.create({ url: extensionUrl });
    }

    /**
     * Opens the FilterTube website in a new tab
     */
    function openWebsite() {
        chrome.tabs.create({ url: 'https://github.com/varshneydevansh/FilterTube' });
    }
});
