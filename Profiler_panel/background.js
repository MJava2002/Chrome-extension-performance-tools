import {runContentScriptCoverage} from "./tab_coverage.js";
import {checkValidUrl, proccessFiles} from "./helpers.js";
import {extensionProfileForFlameGraph} from "./extensionprofiler.js";
import {tabProfileForFlameGraph} from "./tabprofiler.js";

console.log("Service worker loaded");
const TAB = true;
const ExtensionId = "bmpknceehpgjajlnajokmikpknfffgmj";
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

  console.log(
    "Coverage data collected for the extension's background page:",
    coverageData,
  );

  return coverageData;
}

async function runCoverage(extensionId) {
  if (TAB) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      let activeTab = tabs[0];
      sendToDevTools("Active Tab ID: " + activeTab.id);
      tabId = activeTab.id;
      runContentScriptCoverage(tabId, extensionId);
    });
  } else {
    await startExtensionCoverage(extensionId);
    let coverageData;
    await new Promise((r) => setTimeout(r, 10000));
    coverageData = await stopAndCollectExtensionCoverage(extensionId);
    // setTimeout(() => {
    //     stopAndCollectExtensionCoverage().then(coverage => {
    //         console.log("Final Coverage Data:", coverage);
    //         console.log(coverage)
    //         coverageData = coverage;
    //     });
    // }, 5000);  // Adjust delay as needed
    let uniqueFiles = new Set();
    coverageData.result.forEach((script) => {
      if (
        !uniqueFiles.has(script.url) &&
        checkValidUrl(script.url, extensionId)
      ) {
        uniqueFiles.add(script.url);
      }
    });
    proccessFiles(uniqueFiles, coverageData);
  }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "buttonClicked") {
    console.log("Run coverage button clicked");
    const extensionId = "gighmmpiobklfepjocnamgkkbiglidom";
    runCoverage(extensionId);
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "runExtensionClicked") {
    extensionProfileForFlameGraph();
  }
  if (request.action === "runTabClicked") {
    profileWithTabID();
  }
  if (request.action === "flamegraphClicked") {
    // tabProfileForFlameGraph()
    extensionProfileForFlameGraph()
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

      chrome.debugger.sendCommand({ tabId: tabId }, "Profiler.enable", () => {
        console.log("Profiler enabled");
      });

      chrome.debugger.sendCommand({ tabId: tabId }, "Profiler.start", () => {
        console.log("Profiler started");
      });

      await new Promise((r) => setTimeout(r, 3000));

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
