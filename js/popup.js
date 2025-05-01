/**
 * Popup script for FilterTube extension
 * 
 * This script handles the settings popup UI for FilterTube:
 * 1. Loads current filter settings from storage
 * 2. Displays them in the form
 * 3. Saves user changes back to storage
 * 4. Shows success/error messages
 */

// DOM elements we'll interact with
const filterKeywordsElement = document.getElementById('filterKeywords');
const filterChannelsElement = document.getElementById('filterChannels');
const saveButton = document.getElementById('save');
const statusElement = document.getElementById('status');

/**
 * Loads the current filter settings from chrome.storage.local
 * and populates them in the form
 */
function loadSettings() {
    chrome.storage.local.get(['filterKeywords', 'filterChannels'], function(items) {
        // If values exist in storage, populate the form fields
        filterKeywordsElement.value = items.filterKeywords || '';
        filterChannelsElement.value = items.filterChannels || '';
    });
}

/**
 * Saves the current form values to chrome.storage.local
 */
function saveSettings() {
    // Get current values from form
    const filterKeywords = filterKeywordsElement.value.trim();
    const filterChannels = filterChannelsElement.value.trim();
    
    // Save to chrome.storage.local
    chrome.storage.local.set({
        filterKeywords: filterKeywords,
        filterChannels: filterChannels
    }, function() {
        // Show success message
        showStatus('Settings saved!');
        
        // Clear status message after 2 seconds
        setTimeout(function() {
            showStatus('');
        }, 2000);
    });
}

/**
 * Displays a status message to the user
 * @param {string} message - The message to display
 */
function showStatus(message) {
    statusElement.textContent = message;
}

// Initialize the popup by loading settings
document.addEventListener('DOMContentLoaded', loadSettings);

// Add event listener for save button
saveButton.addEventListener('click', saveSettings);
