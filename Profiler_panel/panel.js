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

// const extensionId = "gpjandipboemefakdpakjglanfkfcjei"; // Extension ID
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
                  d3.select("#flameGraph").datum(data).call(chart);
                })
                .catch((error) => {
                  console.warn("Error loading JSON:", error);
                });
            } else {
              console.log("No data found.");
            }
          });
        }
      },
    );
  } else {
    console.error("D3 not loaded");
  }
}

document
  .getElementById("coverageButton")
  .addEventListener("click", drawCoverageTable);

document
  .getElementById("coverageButton")
  .addEventListener("click", function () {
    chrome.runtime.sendMessage({ action: "buttonClicked" });
  });

function drawCoverageTable() {
  chrome.runtime.onMessage.addListener(
    function (message, sender, sendResponse) {
      if (message.action == "coverageDone") {
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

document.getElementById("networkButton").addEventListener("click", function () {
  chrome.runtime.sendMessage({ action: "networkButtonClicked" });
});

document.getElementById("stopButton").addEventListener("click", function () {
  chrome.runtime.sendMessage({ action: "stopButtonClicked" });
});
