import { addImage, drawTable } from "./covered_table.js";
import { detachDebugger } from "./helpers.js";
import { drawNetworkTable } from "./network.js";
const TEXT_COLOR = "#baaec4";
const BORDER_COLOR = "#a79ab4";
const IMAGE_PATH = "styles/Astronaut--Streamline-Bangalore.svg";

let chart = null;
function disableButtons() {
  const coverageButton = document.getElementById("coverageButton");
  const networkButton = document.getElementById("networkButton");
  const flamegraphButton = document.getElementById("flamegraphButton");

  coverageButton.disabled = true;
  networkButton.disabled = true;
  flamegraphButton.disabled = true;

  coverageButton.style.cursor = "not-allowed";
  networkButton.style.cursor = "not-allowed";
  flamegraphButton.style.cursor = "not-allowed";
}

function enableButtons() {
  const coverageButton = document.getElementById("coverageButton");
  const networkButton = document.getElementById("networkButton");
  const flamegraphButton = document.getElementById("flamegraphButton");

  coverageButton.disabled = false;
  networkButton.disabled = false;
  flamegraphButton.disabled = false;

  coverageButton.style.cursor = "";
  networkButton.style.cursor = "";
  flamegraphButton.style.cursor = "";
}

function initializeFlameGraph() {
  if (typeof d3 !== "undefined") {
    console.log("D3 version:", d3.version);

    const chart = flamegraph()
      .width(960)
      .cellHeight(18)
      .transitionDuration(750)
      .minFrameSize(5)
      .transitionEase(d3.easeCubic)
      .title("")
      .label(function (d) {
        return d.data.name + " (" + d.data.value + ")";
      })
      .selfValue(false);
    var details = document.getElementById("details");
    chart.setDetailsElement(details);
    let controlsAdded = false;
    chrome.runtime.onMessage.addListener(
      function (message, sender, sendResponse) {
        if (message.action === "dataSaved") {
          chrome.storage.local.get(["myJsonData"], function (result) {
            if (result.myJsonData && result.myJsonData !== "{}") {
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
                    let resets;
                    resets = document.getElementById("controlsContainer");
                    if (resets) {
                      resets.style.display = "block";
                    }
                  }
                  const docBody = document.getElementById("flameGraph");
                  docBody.innerHTML = "";
                  d3.select("#flameGraph").datum(data).call(chart);
                  chart.search("Run by extension:");

                  const controlsDiv =
                    document.getElementById("controlsContainer");
                  controlsDiv.style.display = "block";

                  if (!controlsAdded) {
                    const resetButton = document.getElementById("resetButton");
                    resetButton.addEventListener("click", function () {
                      chart.resetZoom();
                    });

                    const clearButton = document.getElementById("clearButton");
                    clearButton.addEventListener("click", function () {
                      document.getElementById("term").value = "";
                      chart.clear();
                      chart.search("Run by extension:");
                    });

                    const searchButton =
                      document.getElementById("searchButton");
                    searchButton.addEventListener("click", function () {
                      const searchInput = document.getElementById("term").value;
                      chart.search(searchInput);
                    });

                    controlsAdded = true;
                  }
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
              const docBody = document.getElementById("flameGraph");
              docBody.innerHTML = "";
              let resets;
              resets = document.getElementById("controlsContainer");
              if (resets) {
                resets.style.display = "none";
              }
              // const docBody = document.getElementById("#flameGraph");
              const container = document.createElement("div");
              container.style.width = "100%";
              container.style.border = "1px solid " + BORDER_COLOR;

              container.style.border = "none";
              const emptyRow = document.createElement("div");
              emptyRow.style.textAlign = "center";

              const img = document.createElement("img");
              img.src = IMAGE_PATH;
              img.alt = "Chosen extension is not running";
              img.style.width = "20%";
              const text = document.createElement("div");
              text.textContent = "Chosen extension is not running";
              text.style.fontFamily = "'MyCustomFont', sans-serif";
              text.style.color = TEXT_COLOR;
              text.style.marginTop = "10px";
              text.style.fontSize = "24px";

              emptyRow.appendChild(img);
              emptyRow.appendChild(text);

              container.appendChild(emptyRow);
              docBody.appendChild(container);
            }
          });
        }
      },
    );
  } else {
    console.error("D3 not loaded");
    const loadingImage = document.getElementById("loadingImage");
    if (loadingImage) {
      loadingImage.style.display = "none";
    }
  }
}

document
  .getElementById("coverageButton")
  .addEventListener("click", drawCoverageTable);

document.getElementById("resetButton").addEventListener("click", function () {
  if (chart) {
    chart.resetZoom();
  }
});

document.getElementById("clearButton").addEventListener("click", function () {
  document.getElementById("term").value = "";
  if (chart) {
    chart.clear();
    chart.search("Run by extension:");
  }
});

document.getElementById("searchButton").addEventListener("click", function () {
  const searchInput = document.getElementById("term");
  if (chart) {
    chart.search(searchInput.value);
  }
});

document
  .getElementById("coverageButton")
  .addEventListener("click", function () {
    disableButtons();
    const docBody = document.getElementById("flameGraph");
    docBody.innerHTML = "";
    let resets;
    resets = document.getElementById("controlsContainer");
    if (resets) {
      resets.style.display = "none";
    }

    const loadingImage = document.createElement("img");
    loadingImage.id = "loadingImage";
    loadingImage.src = "styles/load.webp";
    loadingImage.alt = "Loading...";

    loadingImage.style.position = "absolute";
    loadingImage.style.top = "60%";
    loadingImage.style.left = "50%";
    loadingImage.style.transform = "translate(-50%, -50%) scale(0.5)";
    loadingImage.style.display = "block";

    docBody.appendChild(loadingImage);

    chrome.runtime.sendMessage({ action: "buttonClicked" });
    handleButtonClick("coverageButton");
  });

function drawCoverageTable() {
  chrome.runtime.onMessage.addListener(
    function (message, sender, sendResponse) {
      if (message.action === "coverageDone") {
        chrome.storage.local.get(["coverageData"], function (result) {
          if (result.coverageData) {
            const retrievedMap = new Map(result.coverageData);
            console.log("Retrieved Map:", retrievedMap);
            drawTable(retrievedMap);
          }
        });
      }
    },
  );
}
function updateToggleState(isChecked) {
  if (isChecked) {
    console.log("Toggle switched to: Tab");
  } else {
    const extensionId = "your-extension-id-here";
    console.log("Toggle switched to: Extension", extensionId);
    // alert(`Toggle switched to: Extension (ID: ${extensionId})`);
  }
}
document.addEventListener("DOMContentLoaded", function () {
  const toggleSwitch = document.querySelector(
    '.can-toggle input[type="checkbox"]',
  );

  updateToggleState(toggleSwitch.checked);

  toggleSwitch.addEventListener("change", function () {
    const currentState = this.checked ? "Tab" : "Extension";

    chrome.runtime.sendMessage({
      action: "toggleClicked",
      state: currentState,
    });

    updateToggleState(this.checked);
  });
});

document
  .getElementById("flamegraphButton")
  .addEventListener("click", initializeFlameGraph);

document
  .getElementById("flamegraphButton")
  .addEventListener("click", function () {
    disableButtons();

    const docBody = document.getElementById("flameGraph");
    if (docBody) {
      docBody.innerHTML = "";
    }
    let resets;
    resets = document.getElementById("controlsContainer");
    if (resets) {
      resets.style.display = "none";
    }

    const loadingImage = document.createElement("img");
    loadingImage.id = "loadingImage";
    loadingImage.src = "styles/load.webp";
    loadingImage.alt = "Loading...";

    loadingImage.style.position = "absolute";
    loadingImage.style.top = "60%";
    loadingImage.style.left = "50%";
    loadingImage.style.transform = "translate(-50%, -50%) scale(0.5)";
    loadingImage.style.display = "block";

    docBody.appendChild(loadingImage);

    chrome.runtime.sendMessage({ action: "flamegraphClicked" });

    handleButtonClick("flamegraphButton");
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
  chrome.storage.local.set({ networkData: [] }, function () {
    console.log("Network data cleared");
  });
  const docBody = document.getElementById("flameGraph");
  if (docBody) {
    docBody.innerHTML = "";
  }
  let resets;
  resets = document.getElementById("controlsContainer");
  if (resets) {
    resets.style.display = "none";
  }

  const loadingImage = document.createElement("img");
  loadingImage.id = "loadingImage";
  loadingImage.src = "styles/load.webp";
  loadingImage.alt = "Loading...";

  loadingImage.style.position = "absolute";
  loadingImage.style.top = "60%";
  loadingImage.style.left = "50%";
  loadingImage.style.transform = "translate(-50%, -50%) scale(0.5)";
  loadingImage.style.display = "block";

  docBody.appendChild(loadingImage);
  handleButtonClick("networkButton");

  chrome.runtime.onMessage.addListener(
    function (message, sender, sendResponse) {
      if (message.action === "networkDataSaved") {
        chrome.storage.local.get(["networkData"], function (result) {
          if (result.networkData && result.networkData.length) {
            console.log("Retrieved network data:", result.networkData);
            const loadingImage = document.getElementById("loadingImage");
            if (loadingImage) {
              loadingImage.style.display = "none";
            }
            drawNetworkTable(result.networkData);
          } else {
            addImage(
              "styles/Looking-Through-Telescope-2--Streamline-Bangalore (1).svg",
              "Nothing to observe here",
            );
          }
        });
      } else if (message.action === "networkDataNotFound") {
        addImage(
          "styles/Astronaut--Streamline-Bangalore.svg",
          "Chosen extension is not running",
        );
      }
    },
  );
});

document.getElementById("stopButton").addEventListener("click", function () {
  enableButtons();
  chrome.runtime.sendMessage({ action: "stopButtonClicked" });
});

let activeButton = null;

function handleButtonClick(buttonId) {
  console.log("handling click ", buttonId);
  document.getElementById("timeDisplay").innerText = "";
  const button = document.getElementById(buttonId);

  detachDebugger();
  if (activeButton) {
    activeButton.classList.remove("pressed");
  }

  activeButton = button;
  activeButton.classList.add("pressed");

  chrome.runtime.sendMessage({ action: `${buttonId}Clicked` });

  startTime = new Date();
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.activeId?.newValue) {
    coverageButton.disabled = false;
    networkButton.disabled = false;
    flamegraphButton.disabled = false;

    coverageButton.style.cursor = "pointer";
    networkButton.style.cursor = "pointer";
    flamegraphButton.style.cursor = "pointer";
  }
});

chrome.storage.local.get("activeId", function (result) {
  if (result.activeId) {
    console.log(result.activeId);
    coverageButton.disabled = false;
    networkButton.disabled = false;
    flamegraphButton.disabled = false;

    coverageButton.style.cursor = "pointer";
    networkButton.style.cursor = "pointer";
    flamegraphButton.style.cursor = "pointer";
  }
});
