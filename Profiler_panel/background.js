import { runContentScriptCoverage } from "tab_coverage.js";

console.log("Service worker loaded");
const TAB = true;
const extensionId = "gighmmpiobklfepjocnamgkkbiglidom";
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

async function startExtensionCoverage() {
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
async function stopAndCollectExtensionCoverage() {
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

async function runCoverage() {
  if (TAB) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      let activeTab = tabs[0];
      sendToDevTools("Active Tab ID: " + activeTab.id);
      tabId = activeTab.id;
      runContentScriptCoverage(tabId);
    });
  } else {
    await startExtensionCoverage();
    let coverageData;
    await new Promise((r) => setTimeout(r, 10000));
    coverageData = await stopAndCollectExtensionCoverage();
    // setTimeout(() => {
    //     stopAndCollectExtensionCoverage().then(coverage => {
    //         console.log("Final Coverage Data:", coverage);
    //         console.log(coverage)
    //         coverageData = coverage;
    //     });
    // }, 5000);  // Adjust delay as needed
    let uniqueFiles = new Set();
    coverageData.result.forEach((script) => {
      if (!uniqueFiles.has(script.url) && checkValidUrl(script.url)) {
        uniqueFiles.add(script.url);
      }
    });
    proccessFiles(uniqueFiles, coverageData);
  }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "buttonClicked") {
    console.log("Run coverage button clicked");
    runCoverage();
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "runExtensionClicked") {
    profileWithExtensionID();
  }
  if (request.action === "runTabClicked") {
    profileWithTabID();
  }
});

function profileWithTabID() {
  sendToDevTools("Tab ID in DevTools panel!");
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    let activeTab = tabs[0];
    sendToDevTools("Active Tab ID: " + activeTab.id);
    tabId = activeTab.id;
    chrome.debugger.attach({ tabId: tabId }, "1.3", async function () {
      if (chrome.runtime.lastError) {
        sendToDevTools("Error: " + chrome.runtime.lastError.message);
        return;
      }
      sendToDevTools("Debugger attached");

      chrome.debugger.sendCommand({ tabId: tabId }, "Profiler.enable", () => {
        sendToDevTools("Profiler enabled");
      });

      chrome.debugger.sendCommand({ tabId: tabId }, "Profiler.start", () => {
        sendToDevTools("Profiler started");
      });

      await new Promise((r) => setTimeout(r, 3000));

      chrome.debugger.sendCommand(
        { tabId: tabId },
        "Profiler.stop",
        (result) => {
          sendToDevTools("Profiler stopped");
          const profile = result.profile;

          function processProfileData(profile) {
            function processNode(node) {
              let result = {
                name: node.callFrame.functionName || "(anonymous)",
                value: node.selfSize || 1,
                children: [],
              };
              if (node.children) {
                node.children.forEach((childId) => {
                  const childNode = profile.nodes[childId];
                  result.children.push(processNode(childNode));
                });
              }
              return result;
            }
            return processNode(profile.nodes[profile.rootNodeId]);
          }

          const flameGraphData = processProfileData(profile);
          sendToDevTools({
            type: "flameGraphData",
            data: flameGraphData,
          });
        },
      );
    });
  });
}

function profileWithExtensionID() {
  const extensionId = "gighmmpiobklfepjocnamgkkbiglidom";
  sendToDevTools("Extension ID in DevTools panel!");
  chrome.debugger.getTargets((result) => {
    sendToDevTools(result);
    let target = result.find((t) => t.title.includes(extensionId));
    if (target) {
      targetId = target.id;
      chrome.debugger.attach({ targetId: targetId }, "1.3", async function () {
        if (chrome.runtime.lastError) {
          sendToDevTools("Error: " + chrome.runtime.lastError.message);
          return;
        }
        sendToDevTools("Debugger attached");

        // Enable the debugger and profiler
        chrome.debugger.sendCommand(
          { targetId: targetId },
          "Debugger.enable",
          () => {
            sendToDevTools("Debugger enabled");
          },
        );

        chrome.debugger.sendCommand(
          { targetId: targetId },
          "Profiler.enable",
          () => {
            sendToDevTools("Profiler enabled");
          },
        );

        chrome.debugger.sendCommand(
          { targetId: targetId },
          "Profiler.start",
          () => {
            sendToDevTools("Profiler started");
          },
        );

        await new Promise((r) => setTimeout(r, 2000));

        chrome.debugger.sendCommand(
          { targetId: targetId },
          "Profiler.stop",
          (result) => {
            sendToDevTools("Profiler stopped");
            sendToDevTools(
              "Profile nodes: " + JSON.stringify(result.profile.nodes),
            );
          },
        );
      });
    } else {
      sendToDevTools("Target not found.");
    }
  });
}
