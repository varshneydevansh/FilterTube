document.addEventListener('DOMContentLoaded', function () {
    const saveButton = document.getElementById('saveBtn');

    loadSettings();

    saveButton.addEventListener('click', function () {
        const keywords = document.getElementById('keywords').value;
        const channels = document.getElementById('channels').value;

        chrome.storage.local.set({
            'filterKeywords': keywords,
            'filterChannels': channels
        }, function () {
            saveButton.textContent = 'Saved!';
            setTimeout(() => {
                saveButton.textContent = 'Save Preferences';
            }, 2000);
        });
    });

    function loadSettings() {
        chrome.storage.local.get(['filterKeywords', 'filterChannels'], function (items) {
            if (items.filterKeywords) {
                document.getElementById('keywords').value = items.filterKeywords;
            }
            if (items.filterChannels) {
                document.getElementById('channels').value = items.filterChannels;
            }
        });
    }
});
