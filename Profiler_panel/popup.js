let activeId = '';

document.addEventListener("DOMContentLoaded", () => {
  if (!chrome || !chrome.storage) {
    console.error("Chrome storage API is not available.");
    return;
  }
  const detailsLink = document.getElementById("detailsLink");

  const RESTRICTED = "gpojcgmbiiohoppjcpeeceocaocnnjff";
  const RESTRICTED_NAME = "Turbo"
  const extensionsDropdown = document.getElementById("extensionsDropdown");
  const extensionIdDisplay = document.getElementById("extensionIdDisplay");

  chrome.management.getAll(function (extensions) {
    extensions.forEach((extension) => {
      if (extension.type === "extension" && extension.id != RESTRICTED && extension.name != RESTRICTED_NAME) {
        let button = document.createElement("button");
        let option = document.createElement("option");
        option.value = extension.id;
        option.textContent = extension.name;
        extensionsDropdown.appendChild(option);
      }
    });
  });

  extensionsDropdown.addEventListener("change", function () {
    activeId = extensionsDropdown.value;
    if (activeId) {
      extensionIdDisplay.textContent = "Extension ID: " + activeId;
      chrome.storage.local.set({ activeId: activeId }, function () {
        console.log('Active ID saved to storage');
      });
    } else {
      extensionIdDisplay.textContent = "";
    }
  });

  // Open DevTools panel when link is clicked
  detailsLink.addEventListener("click", (e) => {
    e.preventDefault(); // Prevent the default link behavior
    chrome.runtime.sendMessage({ action: "openDevTools" });
  });
});