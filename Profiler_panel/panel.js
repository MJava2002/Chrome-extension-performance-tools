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

import { drawTable } from "./covered_table.js";
import { detachDebugger } from "./helpers.js";

function disableButtons() {
  const coverageButton = document.getElementById("coverageButton")
  const networkButton = document.getElementById("networkButton")
  const flamegraphButton = document.getElementById("flamegraphButton")

  coverageButton.disabled = true;
  networkButton.disabled = true;
  flamegraphButton.disabled = true;

  coverageButton.style.cursor = 'not-allowed';
  networkButton.style.cursor = 'not-allowed';
  flamegraphButton.style.cursor = 'not-allowed';
}

function enableButtons() {
  const coverageButton = document.getElementById("coverageButton")
  const networkButton = document.getElementById("networkButton")
  const flamegraphButton = document.getElementById("flamegraphButton")

  coverageButton.disabled = false;
  networkButton.disabled = false;
  flamegraphButton.disabled = false;

  coverageButton.style.cursor = '';
  networkButton.style.cursor = '';
  flamegraphButton.style.cursor = '';
}

// const extensionId = "gpjandipboemefakdpakjglanfkfcjei"; // Extension ID
function initializeFlameGraph() {
  if (typeof d3 !== "undefined") {
    console.log("D3 version:", d3.version);

    const chart = flamegraph()
      .width(960)
      .cellHeight(18)
      .transitionDuration(750)
      .minFrameSize(5)
      .label(function (d) {
        return d.name + " (" + d.value + ")";
      });
    chrome.runtime.onMessage.addListener(
      function (message, sender, sendResponse) {
        if (message.action === "dataSaved") {
          chrome.storage.local.get(["myJsonData"], function (result) {
            if (result.myJsonData) {
              const retrievedData = JSON.parse(result.myJsonData);
              console.log("Retrieved JSON data:", retrievedData);
              const blob = new Blob([result.myJsonData], {
                type: "application/json",
              });
              const dataUrl = URL.createObjectURL(blob);
              d3.json(dataUrl)
                .then((data) => {
                  const loadingImage = document.getElementById("loadingImage");
                  if (loadingImage) {
                      loadingImage.style.display = "none";
                  }

                  d3.select("#flameGraph").datum(data).call(chart);
                })
                .catch((error) => {
                  console.warn("Error loading JSON:", error);
                  const loadingImage = document.getElementById("loadingImage");
                  if (loadingImage) {
                      loadingImage.style.display = "none";
                  }

                });
            } else {
              console.log("No data found.");
              const loadingImage = document.getElementById("loadingImage");
              if (loadingImage) {
                  loadingImage.style.display = "none";
              }

            }
          });
        }
      },
    );
  } else {
    console.error("D3 not loaded");
    document.getElementById("loadingImage").style.display = "none";
  }
}

document
  .getElementById("coverageButton")
  .addEventListener("click", drawCoverageTable);

document
  .getElementById("coverageButton")
  .addEventListener("click", function () {
    disableButtons();
    chrome.runtime.sendMessage({ action: "buttonClicked" });
    handleButtonClick("coverageButton");
  });

function drawCoverageTable() {
  chrome.runtime.onMessage.addListener(
    function (message, sender, sendResponse) {
      if (message.action === "coverageDone") {
        chrome.storage.local.get(["coverageData"], function (result) {
          if (result.coverageData) {
            // Convert the array of key-value pairs back into a Map
            const retrievedMap = new Map(result.coverageData);
            console.log("Retrieved Map:", retrievedMap);
            drawTable(retrievedMap);
          }
        });
      }
    },
  );
}

document
  .getElementById("flamegraphButton")
  .addEventListener("click", initializeFlameGraph);

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
  chrome.runtime.sendMessage({ action: "runExtensionClicked" });
});

document.getElementById("runTab").addEventListener("click", function () {
  const dropdown = document.getElementById("dropdown-content");
  if (dropdown) {
    dropdown.classList.remove("active");
  }
  chrome.runtime.sendMessage({ action: "runTabClicked" });
});

document
  .getElementById("flamegraphButton")
  .addEventListener("click", function () {
    disableButtons();
    handleButtonClick("flamegraphButton");
    const loadingImage = document.getElementById("loadingImage");
    if (loadingImage) {
        loadingImage.style.display = "block";
    }
    chrome.runtime.sendMessage({ action: "flamegraphClicked" });
  });

function updateDisplay(containerId, message) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerText = message;
  }
}

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

// document.getElementById("recordButton").addEventListener("click", function () {
//   handleButtonClick("recordButton");
//   console.log("Recording started at", startTime);
// });

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
    startTime = null;
    if (activeButton) {
      chrome.runtime.sendMessage({
        action: `${activeButton.id}RecordingStopped`,
        timeElapsed,
      });
      activeButton.classList.remove("pressed");
      console.log(`${activeButton.id}RecordingStopped`);
      activeButton = null;
    }
  } else {
    console.log("Recording not started.");
  }
});

document.getElementById("networkButton").addEventListener("click", function () {
  disableButtons();
  handleButtonClick("networkButton");
});

document.getElementById("stopButton").addEventListener("click", function () {
  enableButtons();
  chrome.runtime.sendMessage({ action: "stopButtonClicked" });
});

let activeButton = null;

function handleButtonClick(buttonId) {
  console.log("handling click ", buttonId);
  document.getElementById("timeDisplay").innerText = ""; // Clear previous time display
  const button = document.getElementById(buttonId);

  detachDebugger();
  if (activeButton) {
    // If there's an active button, remove its "pressed" state
    activeButton.classList.remove("pressed");
  }

  // Set the new active button
  activeButton = button;
  activeButton.classList.add("pressed");

  // Send message for the button clicked
  chrome.runtime.sendMessage({ action: `${buttonId}Clicked` });

  startTime = new Date();
}
