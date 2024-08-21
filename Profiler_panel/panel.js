/*  Collect a profile of an extension's background worker
 *
 *   (!) Attaching to an extension background worker requires
 *   the extensions-on-chrome-urls flag to be set
 *   It works, but it shows a warning: "You are using an unsupported
 *   command-line flag. Stability and security will suffer"
 *
 *   Based on the docs, the silent-debugger-extension-api flag is
 *   requred, but it's unclear whether this is still supported
 */
// const extensionId = "gpjandipboemefakdpakjglanfkfcjei"; // Extension ID


chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  let tab = tabs[0];

  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      files: ["libs/d3.v7.min.js", "libs/d3-flamegraph.min.js", "libs/d3-tip.min.js"],
    },
    () => {
      // D3 is now available in the tab's context
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Ensure D3 is loaded before using it
          if (typeof d3 !== "undefined") {
            console.log("D3 version:", d3.version);

            // panel.js
            console.log('D3 version:', d3.version); // Should log the D3 version

            var chart = flamegraph()
                .width(960);

            const dataUrl = chrome.runtime.getURL("data.json");

            d3.json(dataUrl)
                .then((data) => {
                    console.log('Loaded data:', data); // To confirm data is loaded
                    d3.select("#flameGraph")
                        .datum(data)
                        .call(chart);
                })
                .catch(error => {
                    console.warn("Error loading JSON:", error);
                });
          } else {
            console.error("D3 not loaded");
          }
        },
      });
    },
  );
});


document.getElementById("dropdown").addEventListener("click", function (event) {
  event.stopPropagation(); // Prevent clicks from propagating to the document
  this.classList.toggle("active");
});
document.addEventListener("click", function (event) {
  const dropdown = document.getElementById("dropdown-content");
  if (dropdown) {
    dropdown.classList.remove("active");
  }
});
document.getElementById("runExtension").addEventListener("click", function () {
  // Remove the active class to hide the dropdown
  const dropdown = document.getElementById("dropdown-content");
  if (dropdown) {
    dropdown.classList.remove("active");
  }
  // Send a message to background.js
  chrome.runtime.sendMessage({ action: "runExtensionClicked" });
});

document.getElementById("runTab").addEventListener("click", function () {
  // Remove the active class to hide the dropdown
  const dropdown = document.getElementById("dropdown-content");
  if (dropdown) {
    dropdown.classList.remove("active");
  }
  // Send a message to background.js
  chrome.runtime.sendMessage({ action: "runTabClicked" });
});

document
  .getElementById("coverageButton")
  .addEventListener("click", function () {
    chrome.runtime.sendMessage({ action: "buttonClicked" });
  });

function updateDisplay(containerId, message) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerText = message;
  }
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target === "devtools") {
    updateDisplay(
      "backgroundMessages",
      (document.getElementById("backgroundMessages")?.innerText || "") +
        message.message +
        "\n",
    );
  }
});

// Create a container for background messages
const messagesContainer = document.createElement("div");
messagesContainer.id = "backgroundMessages";
messagesContainer.style.cssText = `
  position: relative;
  left: 10px;
  font-size: 14px;
  color: white;
  font-family: monospace;
  white-space: pre-wrap;
  margin-top: 20px;
`;
document.body.appendChild(messagesContainer);

let startTime, endTime;

document.getElementById("recordButton").addEventListener("click", function () {
  startTime = new Date();
  document.getElementById("timeDisplay").innerText = ""; // Clear previous time display
  console.log("Recording started at", startTime);
});

document.getElementById("stopButton").addEventListener("click", function () {
  if (startTime) {
    endTime = new Date();
    const timeElapsed = ((endTime - startTime) / 1000).toFixed(2); // Time in seconds
    document.getElementById("timeDisplay").innerText =
      `Time: ${timeElapsed} seconds`;
    console.log(
      "Recording stopped at",
      endTime,
      "Elapsed time:",
      timeElapsed,
      "seconds",
    );
  } else {
    console.log("Recording not started.");
  }
});
