

document.addEventListener("DOMContentLoaded", () => {
  if (!chrome || !chrome.storage) {
    console.error("Chrome storage API is not available.");
    return;
  }

  const extensionIdInput = document.getElementById("extensionIdInput");
  const addIdButton = document.getElementById("addIdButton");
  const detailsLink = document.getElementById("detailsLink");

  const RESTRICTED = "gpojcgmbiiohoppjcpeeceocaocnnjff"
  const extensionsDropdown = document.getElementById("extensionsDropdown");
  const extensionIdDisplay = document.getElementById("extensionIdDisplay");

  chrome.management.getAll(function(extensions) {
    extensions.forEach(extension => {
      if (extension.type === "extension" && extension.id != RESTRICTED) {
        let button = document.createElement("button");
        let option = document.createElement("option");
        option.value = extension.id;
        option.textContent = extension.name;
        extensionsDropdown.appendChild(option);
      }
    });
  });

  extensionsDropdown.addEventListener("change", function() {
    const selectedId = extensionsDropdown.value;
    if (selectedId) {
      extensionIdDisplay.textContent = "Extension ID: " + selectedId;
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

