document.addEventListener('DOMContentLoaded', function () {
    const saveButton = document.getElementById('saveBtn');

    // Load the current settings.
    loadSettings();

    saveButton.addEventListener('click', function () {
        const keywords = document.getElementById('keywords').value;
        const channels = document.getElementById('channels').value;

        chrome.storage.local.set({
            'keywords': keywords,
            'channels': channels
        }, function () {
            // Change the button text to "Saved!" for a short duration.
            saveButton.textContent = 'Saved!';
            setTimeout(() => {
                saveButton.textContent = 'Save Preferences';
            }, 2000);  // Change the button text back after 2 seconds
        });
    });

    function loadSettings() {
        chrome.storage.local.get(['keywords', 'channels'], function (items) {
            if (items.keywords) {
                document.getElementById('keywords').value = items.keywords;
            }
            if (items.channels) {
                document.getElementById('channels').value = items.channels;
            }
        });
    }
});
