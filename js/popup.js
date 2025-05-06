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
    const hideAllShortsCheckbox = document.getElementById('hideAllShorts');
    const openInNewTabCheckbox = document.getElementById('openInNewTab');

    // Advanced settings elements - may not exist in popup view
    const exportSettingsBtn = document.getElementById('exportSettingsBtn');
    const importSettingsBtn = document.getElementById('importSettingsBtn');
    const settingsFileInput = document.getElementById('settingsFileInput');
    const settingsPassword = document.getElementById('settingsPassword');
    const setPasswordBtn = document.getElementById('setPasswordBtn');
    const clearPasswordBtn = document.getElementById('clearPasswordBtn');

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
    
    // Set up advanced features if they exist (tab view only)
    if (exportSettingsBtn) {
        exportSettingsBtn.addEventListener('click', exportSettings);
    }
    
    if (importSettingsBtn && settingsFileInput) {
        importSettingsBtn.addEventListener('click', function() {
            settingsFileInput.click();
        });
        settingsFileInput.addEventListener('change', importSettings);
    }
    
    if (setPasswordBtn && settingsPassword) {
        setPasswordBtn.addEventListener('click', setPassword);
    }
    
    if (clearPasswordBtn) {
        clearPasswordBtn.addEventListener('click', clearPassword);
    }

    // Check if we should automatically open in a new tab
    checkAutoOpenInTab();

    /**
     * Loads settings from storage
     */
    function loadSettings() {
        chrome.storage.local.get([
            'filterKeywords', 
            'filterChannels', 
            'hideAllComments', 
            'filterComments',
            'hideAllShorts',
            'openInNewTab',
            'passwordHash',
            'passwordProtected',
            'enableYoutubeKids',
            'syncFilters',
            'kidsKeywords',
            'kidsChannels',
            'optimizePlayback',
            'lightweightChannelDetection'
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
            
            // Set shorts filter value if element exists
            if (hideAllShortsCheckbox) {
                hideAllShortsCheckbox.checked = items.hideAllShorts || false;
            }
            
            // Set open in new tab preference if element exists
            if (openInNewTabCheckbox) {
                openInNewTabCheckbox.checked = items.openInNewTab || false;
            }
            
            // YouTube Kids settings
            const enableYoutubeKidsCheckbox = document.getElementById('enableYoutubeKids');
            const syncFiltersCheckbox = document.getElementById('syncFilters');
            const kidsKeywordsTextarea = document.getElementById('kidsKeywords');
            const kidsChannelsTextarea = document.getElementById('kidsChannels');
            
            if (enableYoutubeKidsCheckbox) {
                enableYoutubeKidsCheckbox.checked = items.enableYoutubeKids || false;
            }
            
            if (syncFiltersCheckbox) {
                syncFiltersCheckbox.checked = items.syncFilters || false;
            }
            
            if (kidsKeywordsTextarea) {
                kidsKeywordsTextarea.value = items.kidsKeywords || '';
            }
            
            if (kidsChannelsTextarea) {
                kidsChannelsTextarea.value = items.kidsChannels || '';
            }
            
            // Performance settings
            const optimizePlaybackCheckbox = document.getElementById('optimizePlayback');
            const lightweightChannelDetectionCheckbox = document.getElementById('lightweightChannelDetection');
            
            if (optimizePlaybackCheckbox) {
                optimizePlaybackCheckbox.checked = items.optimizePlayback !== undefined ? items.optimizePlayback : true;
            }
            
            if (lightweightChannelDetectionCheckbox) {
                lightweightChannelDetectionCheckbox.checked = items.lightweightChannelDetection !== undefined ? items.lightweightChannelDetection : true;
            }
            
            // Check if settings are password protected
            if (items.passwordProtected) {
                // Only show password prompt in tab mode or if not set to always open in tab
                if (isInTabMode() || !items.openInNewTab) {
                    // Check password only if we're in the tab view or popup view
                    checkPasswordProtection();
                }
            }
            
            // Update YouTube Kids filters visibility
            if (enableYoutubeKidsCheckbox && syncFiltersCheckbox) {
                const kidsFiltersContainer = document.getElementById('kidsFiltersContainer');
                if (kidsFiltersContainer) {
                    if (enableYoutubeKidsCheckbox.checked && !syncFiltersCheckbox.checked) {
                        kidsFiltersContainer.style.display = 'block';
                    } else {
                        kidsFiltersContainer.style.display = 'none';
                    }
                }
            }
        });
    }

    /**
     * If user has set the preference to always open in a new tab,
     * automatically redirect from popup to tab view 
     */
    function checkAutoOpenInTab() {
        // Only relevant in popup mode
        if (isInTabMode()) return;
        
        chrome.storage.local.get(['openInNewTab'], function(items) {
            if (items.openInNewTab) {
                // Wait a tiny bit to avoid flicker
                setTimeout(openInNewTab, 100);
            }
        });
    }
    
    /**
     * Check if we're in tab mode
     */
    function isInTabMode() {
        return document.body.classList.contains('tab-view');
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
        const hideAllShorts = false; // Force disable shorts filtering due to UI issues
        const openInNewTab = openInNewTabCheckbox ? openInNewTabCheckbox.checked : false;
        
        // YouTube Kids settings
        const enableYoutubeKidsElement = document.getElementById('enableYoutubeKids');
        const syncFiltersElement = document.getElementById('syncFilters');
        const kidsKeywordsElement = document.getElementById('kidsKeywords');
        const kidsChannelsElement = document.getElementById('kidsChannels');
        
        const enableYoutubeKids = enableYoutubeKidsElement ? enableYoutubeKidsElement.checked : false;
        const syncFilters = syncFiltersElement ? syncFiltersElement.checked : false;
        
        // Performance settings
        const optimizePlaybackElement = document.getElementById('optimizePlayback');
        const lightweightChannelDetectionElement = document.getElementById('lightweightChannelDetection');
        
        const optimizePlayback = optimizePlaybackElement ? optimizePlaybackElement.checked : true;
        const lightweightChannelDetection = lightweightChannelDetectionElement ? lightweightChannelDetectionElement.checked : true;
        
        // Get YouTube Kids filter values
        let kidsKeywords = '';
        let kidsChannels = '';
        
        if (syncFilters) {
            // Use main YouTube filters
            kidsKeywords = filterKeywords;
            kidsChannels = filterChannels;
        } else if (kidsKeywordsElement && kidsChannelsElement) {
            // Use YouTube Kids specific filters
            kidsKeywords = kidsKeywordsElement.value.trim();
            kidsChannels = kidsChannelsElement.value.trim();
        }
        
        // Visual feedback - change button appearance
        const originalButtonText = saveButton.textContent;
        saveButton.classList.add('saved');
        saveButton.textContent = 'Saved!';
        
        // Save to storage
        chrome.storage.local.set({
            filterKeywords: filterKeywords,
            filterChannels: filterChannels,
            hideAllComments: hideAllComments,
            filterComments: filterComments,
            hideAllShorts: hideAllShorts, // Always save as false
            openInNewTab: openInNewTab,
            enableYoutubeKids: enableYoutubeKids,
            syncFilters: syncFilters,
            kidsKeywords: kidsKeywords,
            kidsChannels: kidsChannels,
            optimizePlayback: optimizePlayback,
            lightweightChannelDetection: lightweightChannelDetection
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
    
    /**
     * Export settings to a JSON file
     */
    function exportSettings() {
        // Check if password protected
        chrome.storage.local.get(['passwordProtected', 'passwordHash'], function(items) {
            if (items.passwordProtected) {
                const password = prompt('Enter your password to export settings:');
                if (!password) return; // User cancelled
                
                // Check if it's the master password
                if (password !== 'FilterTube' && !verifyPasswordHash(password, items.passwordHash)) {
                    alert('Incorrect password. Export cancelled.');
                    return;
                }
            }
            
            // Get all settings
            chrome.storage.local.get([
                'filterKeywords',
                'filterChannels',
                'hideAllComments',
                'filterComments',
                'hideAllShorts',
                'openInNewTab',
                'passwordProtected',
                'passwordHash'
            ], function(settings) {
                // Convert to JSON
                const settingsJson = JSON.stringify(settings, null, 2);
                
                // Create a download link
                const blob = new Blob([settingsJson], {type: 'application/json'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'filtertube-settings.json';
                
                // Append to body, click, and remove
                document.body.appendChild(a);
                a.click();
                setTimeout(function() {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 0);
            });
        });
    }
    
    /**
     * Import settings from a JSON file
     */
    function importSettings(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                // Parse the JSON
                const settings = JSON.parse(event.target.result);
                
                // Check if file contains password protection
                if (settings.passwordProtected) {
                    const password = prompt('These settings are password protected. Enter the password:');
                    if (!password) {
                        return; // User cancelled
                    }
                    
                    // Check if it's the master password
                    if (password !== 'FilterTube' && !verifyPasswordHash(password, settings.passwordHash)) {
                        alert('Incorrect password. Import cancelled.');
                        return;
                    }
                }
                
                // Apply the settings
                chrome.storage.local.set(settings, function() {
                    // Reload the form
                    loadSettings();
                    alert('Settings imported successfully!');
                });
            } catch (err) {
                alert('Error importing settings: ' + err.message);
            }
        };
        reader.readAsText(file);
        
        // Reset the file input
        e.target.value = '';
    }
    
    /**
     * Check password protection when loading UI
     */
    function checkPasswordProtection() {
        chrome.storage.local.get(['passwordProtected', 'passwordHash'], function(items) {
            if (items.passwordProtected) {
                // In popup mode, just check if we should redirect to tab view based on openInNewTab setting
                if (!isInTabMode()) {
                    chrome.storage.local.get(['openInNewTab'], function(preferences) {
                        if (preferences.openInNewTab) {
                            // Open in tab view where password will be checked
                            openInNewTab();
                        } else {
                            // Handle password in popup
                            hideUIForPasswordPrompt();
                            promptForPassword();
                        }
                    });
                } else {
                    // In tab view, show password prompt 
                    hideUIForPasswordPrompt();
                    promptForPassword();
                }
            }
        });
    }
    
    /**
     * Hide the UI while waiting for password
     */
    function hideUIForPasswordPrompt() {
        // Hide relevant UI elements
        if (document.getElementById('youtube')) {
            document.getElementById('youtube').style.display = 'none';
        }
        if (document.getElementById('youtube-kids')) {
            document.getElementById('youtube-kids').style.display = 'none';
        }
        if (document.getElementById('settings')) {
            document.getElementById('settings').style.display = 'none';
        }
        if (document.querySelector('.tab-buttons')) {
            document.querySelector('.tab-buttons').style.display = 'none';
        }
        if (saveButton) {
            saveButton.style.display = 'none';
        }
    }
    
    /**
     * Show password prompt and handle response
     */
    function promptForPassword() {
        chrome.storage.local.get(['passwordHash'], function(items) {
            const password = prompt('Enter your password to access FilterTube settings:');
            if (!password) {
                // User cancelled, close the interface
                window.close();
                return;
            }
            
            // Check if it's the master password or correct password
            if (password === 'FilterTube' || verifyPasswordHash(password, items.passwordHash)) {
                // Show the UI
                showUIAfterPasswordSuccess();
            } else {
                alert('Incorrect password. Access denied.');
                window.close();
            }
        });
    }
    
    /**
     * Show the UI after successful password verification
     */
    function showUIAfterPasswordSuccess() {
        // Show relevant UI elements
        if (document.getElementById('youtube')) {
            document.getElementById('youtube').style.display = 'block';
        }
        if (document.getElementById('youtube-kids')) {
            document.getElementById('youtube-kids').style.display = 'none';
        }
        if (document.getElementById('settings')) {
            document.getElementById('settings').style.display = 'none';
        }
        if (document.querySelector('.tab-buttons')) {
            document.querySelector('.tab-buttons').style.display = 'flex';
            // Activate YouTube tab
            const tabButtons = document.querySelectorAll('.tab-button');
            tabButtons.forEach(btn => {
                if (btn.getAttribute('data-tab') === 'youtube') {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }
        if (saveButton) {
            saveButton.style.display = 'block';
        }
    }
    
    /**
     * Set a password to protect the settings
     */
    function setPassword() {
        const password = settingsPassword.value;
        
        if (!password) {
            alert('Please enter a password.');
            return;
        }
        
        // Hash the password (simple hash for example purposes)
        const hash = generatePasswordHash(password);
        
        // Save the password hash and protection flag
        chrome.storage.local.set({
            passwordProtected: true,
            passwordHash: hash
        }, function() {
            alert('Password protection enabled!');
            settingsPassword.value = '';
        });
    }
    
    /**
     * Clear password protection
     */
    function clearPassword() {
        chrome.storage.local.get(['passwordProtected', 'passwordHash'], function(items) {
            if (items.passwordProtected) {
                const password = prompt('Enter your current password to remove protection:');
                if (!password) return; // User cancelled
                
                // Check if it's the master password or correct password
                if (password === 'FilterTube' || verifyPasswordHash(password, items.passwordHash)) {
                    chrome.storage.local.set({
                        passwordProtected: false,
                        passwordHash: ''
                    }, function() {
                        alert('Password protection removed!');
                        settingsPassword.value = '';
                    });
                } else {
                    alert('Incorrect password. Operation cancelled.');
                }
            } else {
                alert('No password protection is currently enabled.');
            }
        });
    }
    
    /**
     * Generate a password hash
     * Note: In a production environment, use a proper crypto library
     */
    function generatePasswordHash(password) {
        // Simple hash function for demonstration
        // In real-world use, implement a secure hashing algorithm
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(16); // Convert to hex
    }
    
    /**
     * Verify a password against a hash
     */
    function verifyPasswordHash(password, storedHash) {
        const hash = generatePasswordHash(password);
        return hash === storedHash;
    }
});
