import { detachDebugger, setAttached } from "./helpers.js";

let id;
let debugee;

function startRequestMonitoring() {
  let requestTimes = {};

  chrome.debugger.onEvent.addListener(function (debuggeeId, message, params) {
    const pattern = `chrome-extension://${id}`;
    if (message === "Network.requestWillBeSent") {
      console.log("Request intercepted: ", params);
      if (
        params.initiator.stack &&
        params.initiator.stack.callFrames[0].url.startsWith(pattern)
      ) {
        requestTimes[params.requestId] = {
          startTime: params.timestamp,
          url: params.request.url,
          method: params.request.method,
        };
      }
    }
  });

  chrome.debugger.onEvent.addListener(function (debuggeeId, message, params) {
    if (message === "Network.responseReceived") {
      console.log("Response received: ", params.response);
      if (requestTimes[params.requestId]) {
        // Retrieve the request start time and compute latency
        const startTime = requestTimes[params.requestId].startTime;
        const endTime = params.timestamp;
        const latency = endTime - startTime;

        // Add additional details to the request data
        const requestData = {
          url: requestTimes[params.requestId].url,
          method: requestTimes[params.requestId].method,
          latency: latency.toFixed(4) * 1000, // convert to ms
          status: params.response.status,
          type: params.type,
          size: params.response.encodedDataLength,
        };

        // Save the data in chrome storage
        saveRequestData(requestData);

        delete requestTimes[params.requestId];
      }
    }
  });
}

function saveRequestData(requestData) {
  chrome.storage.local.get({ networkData: [] }, function (result) {
    const networkData = result.networkData;
    networkData.push(requestData);

    chrome.storage.local.set({ networkData: networkData }, function () {
      console.log("Network request data saved:", requestData);
    });
  });
}

export function startNetwork(extensionId) {
  id = extensionId;
  chrome.debugger.getTargets((result) => {
    console.log(result);
    let target = result.find((t) => t.title.includes(extensionId));

    if (target) {
      const targetId = target.id;
      debugee = { targetId: targetId };
      console.log("Found target:", target);
      chrome.debugger.attach({ targetId: targetId }, "1.3", async function () {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          return;
        }
        setAttached({ targetId: targetId });
        chrome.debugger.sendCommand(
          { targetId: targetId },
          "Debugger.enable",
          () => {
            console.log("Debugger enabled");
          },
        );

        chrome.debugger.sendCommand(
          { targetId: targetId },
          "Network.enable",
          () => {
            console.log("Network enabled");
          },
        );

        startRequestMonitoring();
      });
    } else {
      console.log("No matching target found.");
    }
  });
}

export function startNetworkWithTabID(extensionId) {
  id = extensionId;
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    let activeTab = tabs[0];
    const tabId = activeTab.id;
    debugee = { tabId: tabId };
    chrome.debugger.attach({ tabId: tabId }, "1.3", async function () {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        return;
      }
      setAttached({ tabId: tabId });
      // Enable debugger
      chrome.debugger.sendCommand({ tabId: tabId }, "Debugger.enable", () => {
        console.log("Debugger enabled");
      });

      chrome.debugger.sendCommand({ tabId: tabId }, "Network.enable", () => {
        console.log("Network enabled");
      });

      startRequestMonitoring();
    });
  });
}

export function stopNetwork() {
  if (debugee) {
    chrome.debugger.sendCommand(debugee, "Network.disable", () => {
      // console.log(debugee);
      console.log("Network disabled");
      // chrome.debugger.detach(debugee);
      chrome.runtime.sendMessage({ action: "networkDataSaved" });
      detachDebugger();
      console.log("Debugger detached");
      debugee = null;
    });
  }
}

const BORDER_COLOR = "#a79ab4";

export function drawNetworkTable(networkData) {
  const docBody = document.getElementById("flameGraph");
  docBody.innerHTML = "";

  const container = document.createElement("div");
  container.style.width = "100%";
  container.style.border = "1px solid " + BORDER_COLOR;

  // Create the table element
  const table = document.createElement("table");
  table.style.width = "100%";
  table.style.borderCollapse = "collapse";

  // Create the table headers
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  const headers = ["URL", "Method", "Status", "Type", "Size", "Latency", "Waterfall"];
  
  headers.forEach(headerText => {
    const th = document.createElement("th");
    th.textContent = headerText;
    th.style.border = "1px solid " + BORDER_COLOR;
    th.style.padding = "8px";
    th.style.textAlign = "left";
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create the table body
  const tbody = document.createElement("tbody");
  table.appendChild(tbody);

  // Append the table to the container
  container.appendChild(table);
  docBody.appendChild(container);

  drawRows(tbody, networkData);
}

function drawRows(tbody, networkData) {
  networkData.forEach(requestData => {
    const row = tbody.insertRow();

    const nameCell = row.insertCell(0);
    const methodCell = row.insertCell(1);
    const statusCell = row.insertCell(2);
    const typeCell = row.insertCell(3);
    const sizeCell = row.insertCell(4);
    const timeCell = row.insertCell(5);
    const waterfallCell = row.insertCell(6);

    nameCell.textContent = requestData.url.split('/').pop();  // Just the file name
    methodCell.textContent = requestData.method;
    statusCell.textContent = requestData.status;
    typeCell.textContent = requestData.type;
    sizeCell.textContent = `${(requestData.size / 1024).toFixed(2)} KB`; // Convert size to KB
    timeCell.textContent = `${requestData.latency} ms`;

    // Create the waterfall bar
    const waterfallBar = document.createElement('div');
    waterfallBar.className = 'bar';
    waterfallBar.style.width = `${requestData.latency}px`; // Scale this as needed
    waterfallBar.style.height = '20px';
    waterfallBar.style.backgroundColor = '#76c7c0'; // Adjust color as needed
    waterfallCell.appendChild(waterfallBar);

    // Style the row
    [nameCell, methodCell, statusCell, typeCell, sizeCell, timeCell, waterfallCell].forEach(cell => {
      cell.style.border = "1px solid " + BORDER_COLOR;
      cell.style.padding = "8px";
    });
  });
}

