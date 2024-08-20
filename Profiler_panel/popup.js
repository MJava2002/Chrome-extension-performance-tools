document.addEventListener("DOMContentLoaded", () => {
  // Ensure chrome.storage is available
  if (!chrome || !chrome.storage) {
    console.error("Chrome storage API is not available.");
    return;
  }

  const extensionDropdown = document.getElementById("extensionDropdown");
  const extensionIdInput = document.getElementById("extensionIdInput");
  const addIdButton = document.getElementById("addIdButton");

  // Initialize dropdown with IDs from storage
  chrome.storage.local.get("extensionIds", (result) => {
    const ids = result.extensionIds || [];
    populateDropdown(ids);
  });

  // Add new ID when button is clicked
  addIdButton.addEventListener("click", () => {
    addExtensionId();
  });

  // Add new ID on Enter key press
  extensionIdInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addExtensionId();
    }
  });

  function addExtensionId() {
    const newId = extensionIdInput.value.trim();
    if (newId) {
      chrome.storage.local.get("extensionIds", (result) => {
        const ids = result.extensionIds || [];
        if (!ids.includes(newId)) {
          ids.push(newId);
          chrome.storage.local.set({ extensionIds: ids }, () => {
            populateDropdown(ids);
            extensionIdInput.value = ""; // Clear input field after adding
          });
        }
      });
    }
  }

  function populateDropdown(ids) {
    extensionDropdown.innerHTML = ""; // Clear existing options
    ids.forEach((id) => {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = id;
      extensionDropdown.appendChild(option);
    });
  }
});
