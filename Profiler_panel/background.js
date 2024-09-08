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

let tabIsChecked = false;

let targetNotFound = false;

chrome.storage.local.remove("attachedTarget");

const TAB = false;

var tabId;

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
    console.log("Background page not found.");
    return { result: [] };
  }


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


}

async function stopAndCollectExtensionCoverage(extensionId) {
  const targets = await chrome.debugger.getTargets();
  const backgroundPage = targets.find(
    (target) => target.type === "worker" && target.url.includes(extensionId),
  );

  if (!backgroundPage) {
    console.log("Background page not found.");
    return { result: [] };
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


  return coverageData;
}

async function runCoverage(extensionId) {
  if (tabIsChecked) {
    chrome.tabs.query(
      { active: true, currentWindow: true },
      async function (tabs) {
        let activeTab = tabs[0];

        tabId = activeTab.id;
        const covData = await runContentScriptCoverage(tabId, extensionId);
        const mapArray = Array.from(covData.entries());


        await new Promise((resolve, reject) => {
          chrome.storage.local.set({ coverageData: mapArray }, function () {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError));
            } else {

              resolve();
            }
          });
        });

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
    const covData = await proccessFiles(uniqueFiles, coverageData, extensionId, false);

    const mapArray = Array.from(covData.entries());

    await new Promise((resolve, reject) => {
      chrome.storage.local.set({ coverageData: mapArray }, function () {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError));
        } else {

          resolve();
        }
      });
    });

    chrome.runtime.sendMessage({ action: "coverageDone" });
  }
}

chrome.runtime.onMessage.addListener(
  async function (request, sender, sendResponse) {
    if (request.action === "buttonClicked") {
      
      const extensionId = await getId();

      runCoverage(extensionId);
    }
  },
);
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "changeTargetBool") {
    targetNotFound = true;
    
  }

});
chrome.runtime.onMessage.addListener(
  async function (request, sender, sendResponse) {
    if (request.action === "flamegraphClicked") {
      if (!tabIsChecked) {
        const extensionId = await getId();
        if (extensionId) {
         
          extensionProfileForFlameGraph(extensionId);
        } else {

        }
      } else if (tabIsChecked) {
        tabProfileForFlameGraph();
      }
    }


    if (request.action === "toggleClicked") {
      tabIsChecked = request.state === "Tab";
    }
  },
);

chrome.runtime.onMessage.addListener(
  async function (request, sender, sendResponse) {
    if (request.action === "networkButtonClicked") {
      const extensionId = await getId();

      if (tabIsChecked) {

        startNetworkWithTabID(extensionId);
      } else {

        startNetwork(extensionId);
      }
    }
  },
);

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "stopButtonClicked") {

    stopNetwork();
  }
});
