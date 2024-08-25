import { runContentScriptCoverage } from "./tab_coverage.js";
import { checkValidUrl } from "./helpers.js";
import { proccessFiles } from "./helpers.js";
import { startNetwork, startNetworkWithTabID, stopNetwork } from "./network.js";

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

function tabProfileForFlameGraph() {
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
          console.log("Profiler result:", profile);
          console.log(JSON.stringify(profile, null, 2));
          const transformedData = transformProfileData(profile);
          console.log("Before saving", profile);
          const jsonData = JSON.stringify(transformedData, null, 2)

          // Save the stringified JSON using chrome.storage.local
          chrome.storage.local.set({ myJsonData: jsonData }, function() {
              console.log('JSON data has been saved.');
              chrome.runtime.sendMessage({ action: 'dataSaved' });
          });
        }
      );
    });
  });
}
function transformProfileData(profile) {
  if (!profile || !profile.nodes || !profile.nodes.length) {
    console.error('Invalid profile data');
    return null;
  }

  const nodes = profile.nodes;
  const sampleTimes = profile.timeDeltas || [];
  let totalTime = sampleTimes.reduce((sum, time) => sum + time, 0);

  // Create a map of node IDs to their children
  const childrenMap = new Map();
  const idMap = new Map();
  // Map from id to index

  nodes.forEach((node, index) => {
      if (node.children) {
          childrenMap.set(node.id, node.children); // Map id to children
      }
      idMap.set(node.id, index); // Map id to index
  });

  console.log(idMap);
  function processNode(nodeId) {
    const idx = idMap.get(nodeId);
    const node = nodes[idx];

    if (!node) return null;

    const result = {
      name: node.callFrame.functionName || `(${node.callFrame.url})`,
      value: node.selfTime || 1,
      children: []
    };

    const children = childrenMap.get(nodeId) || [];
    children.forEach(childId => {
      const childNode = processNode(childId);
      if (childNode) {
        result.children.push(childNode);
        result.value += childNode.value; // Accumulate time from children
      }
    });

    return result;
  }

  // Start from the root node (usually the first node)
  const rootNode = processNode(nodes[0].id);

  // Normalize values to percentages of total time
  function normalizeValues(node) {
    node.value = (node.value / totalTime) * 100;
    node.children.forEach(normalizeValues);
  }
  normalizeValues(rootNode);

  return rootNode;
}

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

function extensionProfileForFlameGraph() {
  const extensionId = "gighmmpiobklfepjocnamgkkbiglidom";
  // sendToDevTools("Extension ID in DevTools panel!");
  chrome.debugger.getTargets((result) => {
    // sendToDevTools(result);
    let target = result.find((t) => t.title.includes(extensionId));
    if (target) {
      const targetId = target.id;
      chrome.debugger.attach({ targetId: targetId }, "1.3", async function () {
        if (chrome.runtime.lastError) {
          console.log("Error: " + chrome.runtime.lastError.message);
          return;
        }
        console.log("Debugger attached");
        // Enable the debugger and profiler
        chrome.debugger.sendCommand(
          { targetId: targetId },
          "Debugger.enable",
          () => {
            console.log("Debugger enabled");
          },
        );

        chrome.debugger.sendCommand(
          { targetId: targetId },
          "Profiler.enable",
          () => {
            console.log("Profiler enabled");
          },
        );

        chrome.debugger.sendCommand(
          { targetId: targetId },
          "Profiler.start",
          () => {
            console.log("Profiler started");
          },
        );

        await new Promise((r) => setTimeout(r, 5000));

        chrome.debugger.sendCommand(
          { targetId: targetId },
          "Profiler.stop",
          (result) => {
            console.log("RESULT IS", result)
            const profile = result.profile;
            console.log("PROFILERRR:", profile);
            console.log(JSON.stringify(profile, null, 2));
            const transformedData = transformProfileData(profile);
            console.log("BEFORRRRRRRRRRRE", profile);

            // Serialize JSON object to a string
            const jsonData = JSON.stringify(transformedData, null, 2)
            console.log(jsonData)
            // Save the stringified JSON using chrome.storage.local
            chrome.storage.local.set({ myJsonData: jsonData }, function() {
              console.log('JSON data has been saved.');
              chrome.runtime.sendMessage({ action: 'dataSaved' });
            });
          },
        );
      });
    } else {
      sendToDevTools("Target not found.");
    }
  });
}

chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    // console.log('Request captured:', details);
  },
  { urls: ["<all_urls>"] }
);

// Handle debugger detachment
chrome.debugger.onDetach.addListener(function(source, reason) {
  console.log("Debugger detached: ", reason);
});


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "networkButtonClicked") {
    const extensionId = "eillpajpafkjenplkofjfimdipclffpk";
    console.log("Network button clicked");
    startNetworkWithTabID(extensionId);
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "stopButtonClicked") {
    console.log("Stop button clicked");
    stopNetwork();
  }
});
