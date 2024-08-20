document.addEventListener('DOMContentLoaded', () => {
    const extensionDropdown = document.getElementById('extensionDropdown');
    const extensionIdInput = document.getElementById('extensionIdInput');
    const addIdButton = document.getElementById('addIdButton');

    // Load stored extension IDs and populate dropdown
    chrome.storage.local.get('extensionIds', (result) => {
        const ids = result.extensionIds || [];
        populateDropdown(ids);
    });

    // Add new ID on button click
    addIdButton.addEventListener('click', () => {
        addExtensionId();
    });

    // Add new ID on Enter key press
    extensionIdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addExtensionId();
        }
    });

    function addExtensionId() {
        const newId = extensionIdInput.value.trim();
        if (newId) {
            chrome.storage.local.get('extensionIds', (result) => {
                const ids = result.extensionIds || [];
                if (!ids.includes(newId)) {
                    ids.push(newId);
                    chrome.storage.local.set({ extensionIds: ids }, () => {
                        populateDropdown(ids);
                        extensionIdInput.value = '';
                    });
                }
            });
        }
    }

    function populateDropdown(ids) {
        extensionDropdown.innerHTML = ''; // Clear existing options
        ids.forEach(id => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = id;
            extensionDropdown.appendChild(option);
        });
    }
});
