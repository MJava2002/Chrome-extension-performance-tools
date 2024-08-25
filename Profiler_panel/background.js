import {runContentScriptCoverage} from "./tab_coverage.js";
import {checkValidUrl, proccessFiles} from "./helpers.js";

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
    profileWithExtensionID();
  }
  if (request.action === "runTabClicked") {
    profileWithTabID();
  }
  if (request.action === "flamegraphClicked") {
    profileForFlameGraph()
  }

});
function profileForFlameGraph() {
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
          console.log("Profiler result:", profile);
          console.log(JSON.stringify(profile, null, 2));
          // Example usage:
          // Assuming `profileData` is the entire JSON object from profile.json
          const transformedData = transformProfileData(profile);
          console.log("Before saving", profile);

          // Serialize JSON object to a string
          const jsonData = JSON.stringify(transformedData, null, 2)

          // Save the stringified JSON using chrome.storage.local
          chrome.storage.local.set({ myJsonData: jsonData }, function() {
              console.log('JSON data has been saved.');
              chrome.runtime.sendMessage({ action: 'dataSaved' });
          });
          /*  save result of json*/
          // const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
          // const reader = new FileReader();
          //
          // reader.onload = function() {
          //   chrome.downloads.download({
          //     url: reader.result,
          //     filename: 'profile.json',
          //     conflictAction: 'overwrite' // Change this as needed
          //   }, (downloadId) => {
          //     console.log(`Download started with ID: ${downloadId}`);
          //   });
          // };
          //
          // reader.readAsDataURL(blob);
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

    // console.log("Node:", node);
    // console.log(`id: ${nodeId}, idx: ${idx}`);
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
// Count nodes


// function transformNode(node, allNodes) {
//     // Create the transformed node with children first
//     const transformedNode = {
//         // Initialize an empty children array
//         children: []
//     };
//
//     // If the node has children, transform them recursively
//     if (node.children && node.children.length > 0) {
//         transformedNode.children = node.children.map(index => transformNode(allNodes[index], allNodes));
//     }
//
//     // After children are processed, add name and value
//     transformedNode.name = node.callFrame.functionName;
//     transformedNode.value = node.hitcount;
//
//     return transformedNode;
// }
// function transformProfile(profileData) {
//   console.log("profile", profileData)
//   console.log("First", profileData.profile.nodes[0])
//   return transformNode(profileData.profile.nodes[0],profileData.profile.nodes);
// }


const profileData = {
  "profile": {
    "nodes": [
      {
        "callFrame": { "functionName": "root" },
        "hitcount": 100,
        "children": [1, 2]
      },
      {
        "callFrame": { "functionName": "function1" },
        "hitcount": 50,
        "children": [3]
      },
      {
        "callFrame": { "functionName": "function2" },
        "hitcount": 30,
        "children": []
      },
      {
        "callFrame": { "functionName": "function3" },
        "hitcount": 20,
        "children": [4, 5]
      },
      {
        "callFrame": { "functionName": "function4" },
        "hitcount": 10,
        "children": []
      },
      {
        "callFrame": { "functionName": "function5" },
        "hitcount": 5,
        "children": []
      }
    ]
  }
}


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

function profileWithExtensionID() {
  const extensionId = "gighmmpiobklfepjocnamgkkbiglidom";
  sendToDevTools("Extension ID in DevTools panel!");
  chrome.debugger.getTargets((result) => {
    sendToDevTools(result);
    let target = result.find((t) => t.title.includes(extensionId));
    if (target) {
      const targetId = target.id;
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