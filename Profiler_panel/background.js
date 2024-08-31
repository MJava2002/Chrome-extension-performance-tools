import { runContentScriptCoverage } from "./tab_coverage.js";
import {
  checkValidUrl,
  detachDebugger,
  getId,
  proccessFiles,
  setAttached,
  waitForStopButtonClick,
} from "./helpers.js";
import { extensionProfileForFlameGraph } from "./extensionprofiler.js";
import { tabProfileForFlameGraph } from "./tabprofiler.js";
import { startNetwork, startNetworkWithTabID, stopNetwork } from "./network.js";

console.log("Service worker loaded");
chrome.storage.local.remove("attachedTarget");

const TAB = false;
var tabId;
function isExtensionNode(node) {
  return node.callFrame.url.includes(extensionId);
}
function sendToDevTools(message) {
  chrome.runtime.sendMessage({
    target: "devtools",
    message: message,
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openDevTools") {
    chrome.windows.create(
      {
        url: chrome.runtime.getURL("devtools.html"),
        type: "popup",
        width: 400,
        height: 500,
      },
      (window) => {
        console.log("DevTools window created", window);
      },
    );
  }
});

async function startExtensionCoverage(extensionId) {
  const targets = await chrome.debugger.getTargets();
  const backgroundPage = targets.find(
    (target) => target.type === "worker" && target.url.includes(extensionId),
  );

  if (!backgroundPage) {
    console.error("Background page not found.");
    return;
  }

  console.log(backgroundPage.id);
  await chrome.debugger.attach({ targetId: backgroundPage.id }, "1.3");
  setAttached({ targetId: backgroundPage.id });

  await chrome.debugger.sendCommand(
    { targetId: backgroundPage.id },
    "Profiler.enable",
  );

  await chrome.debugger.sendCommand(
    { targetId: backgroundPage.id },
    "Profiler.startPreciseCoverage",
    {
      callCount: true,
      detailed: true,
    },
  );

  console.log("Coverage started for the extension's background page.");
}

// Function to stop and collect coverage data
async function stopAndCollectExtensionCoverage(extensionId) {
  const targets = await chrome.debugger.getTargets();
  const backgroundPage = targets.find(
    (target) => target.type === "worker" && target.url.includes(extensionId),
  );

  if (!backgroundPage) {
    console.error("Background page not found.");
    return;
  }

  // Collect data
  const coverageData = await chrome.debugger.sendCommand(
    { targetId: backgroundPage.id },
    "Profiler.takePreciseCoverage",
  );

  // Stop
  await chrome.debugger.sendCommand(
    { targetId: backgroundPage.id },
    "Profiler.stopPreciseCoverage",
  );

  // Disable
  await chrome.debugger.sendCommand(
    { targetId: backgroundPage.id },
    "Profiler.disable",
  );

  // Detach
  await chrome.debugger.detach({ targetId: backgroundPage.id });
  // await detachDebugger();

  console.log(
    "Coverage data collected for the extension's background page:",
    coverageData,
  );

  return coverageData;
}

async function runCoverage(extensionId) {
  if (TAB) {
    chrome.tabs.query(
      { active: true, currentWindow: true },
      async function (tabs) {
        let activeTab = tabs[0];
        sendToDevTools("Active Tab ID: " + activeTab.id);
        tabId = activeTab.id;
        const covData = await runContentScriptCoverage(tabId, extensionId);
        const mapArray = Array.from(covData.entries());
        console.log("runCoverge", covData);
        // Save the array in chrome.storage.local
        await new Promise((resolve, reject) => {
          chrome.storage.local.set({ coverageData: mapArray }, function () {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError));
            } else {
              console.log("Map data has been saved.", covData);
              resolve();
            }
          });
        });

        // Send the coverageDone message
        chrome.runtime.sendMessage({ action: "coverageDone" });
      },
    );
  } else {
    await startExtensionCoverage(extensionId);
    let coverageData;
    await waitForStopButtonClick();
    coverageData = await stopAndCollectExtensionCoverage(extensionId);
    let uniqueFiles = new Set();
    coverageData.result.forEach((script) => {
      if (
        !uniqueFiles.has(script.url) &&
        checkValidUrl(script.url, extensionId)
      ) {
        uniqueFiles.add(script.url);
      }
    });
    const covData = await proccessFiles(uniqueFiles, coverageData, extensionId);
    console.log("runCoverge", covData);
    const mapArray = Array.from(covData.entries());
    // Save the array in chrome.storage.local
    await new Promise((resolve, reject) => {
      chrome.storage.local.set({ coverageData: mapArray }, function () {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError));
        } else {
          console.log("Map data has been saved.", covData);
          resolve();
        }
      });
    });

    // Send the coverageDone message
    chrome.runtime.sendMessage({ action: "coverageDone" });
  }
}

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  if (request.action === "buttonClicked") {
    console.log("Run coverage button clicked");
    const extensionId = await getId()
    console.log(extensionId)
    runCoverage(extensionId);
  }
});

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  if (request.action === "runExtensionClicked") {
    const extensionId = await getId();
    extensionProfileForFlameGraph(extensionId);
  }
  if (request.action === "runTabClicked") {
    profileWithTabID();
  }
  if (request.action === "flamegraphClicked") {
    const extensionId = await getId();
    extensionProfileForFlameGraph(extensionId);
    // extensionProfileForFlameGraph();
  }
});

function profileWithTabID() {
  console.log("Tab ID in DevTools panel!");
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    let activeTab = tabs[0];
    console.log("Active Tab ID: " + activeTab.id);
    tabId = activeTab.id;
    chrome.debugger.attach({ tabId: tabId }, "1.3", async function () {
      if (chrome.runtime.lastError) {
        console.log("Error: " + chrome.runtime.lastError.message);
        return;
      }
      console.log("Debugger attached");
      setAttached({ tabId: tabId });

      chrome.debugger.sendCommand({ tabId: tabId }, "Profiler.enable", () => {
        console.log("Profiler enabled");
      });

      chrome.debugger.sendCommand({ tabId: tabId }, "Profiler.start", () => {
        console.log("Profiler started");
      });

      await waitForStopButtonClick();

      chrome.debugger.sendCommand(
        { tabId: tabId },
        "Profiler.stop",
        (result) => {
          console.log("Profiler stopped");
          const profile = result.profile;
          console.log("PROOOOOOFILE", profile);

          chrome.runtime.sendMessage({
            target: "panel.js",
            type: "flameGraphData",
            data: profile,
          });
        },
      );
    });
  });
}

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  if (request.action === "networkButtonClicked") {
    // const extensionId = await getId();
    const extensionId = "mdnleldcmiljblolnjhpnblkcekpdkpa";
    console.log("Network button clicked");
    startNetwork(extensionId);
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "stopButtonClicked") {
    console.log("Stop button clicked");
    stopNetwork();
  }
});
