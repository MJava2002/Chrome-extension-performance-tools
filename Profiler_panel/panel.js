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

console.log("THIS IS THE END" + chrome.devtools.inspectedWindow.tabId);

console.log("Panel script loaded");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.target === "panel" && message.type === "flameGraphData") {
        console.log("Received flame graph data:", message.data);

    }
});
function initializeFlameGraph() {
  if (typeof d3 !== "undefined") {
    console.log("D3 version:", d3.version);

    const chart = flamegraph()
      .width(960)
      .cellHeight(18)
      .transitionDuration(750)
      .minFrameSize(5)
      .title("HERE LIES MY HOPES AND DREAMS")
      .label(function (d) {
        return d.name + " (" + d.value + ")";
      });

    console.log("Flame graph object created");

    const dataUrl = chrome.runtime.getURL("data.json");
    d3.json(dataUrl)
      .then((data) => {
        console.log("Data loaded:", data);
        d3.select("#flameGraph").datum(data).call(chart);
        console.log("Flame graph should now be rendered");
      })
      .catch((error) => {
        console.warn("Error loading JSON:", error);
      });
  } else {
    console.error("D3 not loaded");
  }
}

// Wait for the DOM to be fully loaded before initializing the flame graph
document.getElementById("flamegraphButton").addEventListener("click", initializeFlameGraph);

// If you need to interact with the inspected window, you can use:
chrome.devtools.inspectedWindow.eval(
  "console.log('This is logged in the inspected page');",
  function (result, isException) {
    if (isException) console.log("Error:", isException);
  },
);

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

document
  .getElementById("flamegraphButton")
  .addEventListener("click", function () {
    chrome.runtime.sendMessage({ action: "flamegraphClicked" });
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
