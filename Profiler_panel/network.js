import { detachDebugger, setAttached } from "./helpers.js";

let id;
let debugee;

function startRequestMonitoring() {
  let requestInfo = {};

  chrome.debugger.onEvent.addListener(function (debuggeeId, message, params) {
    const pattern = `chrome-extension://${id}`;
    if (message === "Network.requestWillBeSent") {
      console.log("Request intercepted: ", params);
      if (
        (params.initiator.stack &&
          params.initiator.stack.callFrames[0] &&
          params.initiator.stack.callFrames[0].url.startsWith(pattern)) ||
        params.documentURL.startsWith(pattern)
      ) {
        const initiator = params.initiator.stack.callFrames[0].functionName ||
        params.initiator.stack.callFrames[0].url; 
        requestInfo[params.requestId] = {
          id: params.requestId,
          startTime: params.timestamp,
          url: params.request.url,
          method: params.request.method,
          size: 0,
          initiator: initiator,
          latency: -1,
          status: -1,
          type: null,
          timing: null,
          recvStart: -1,
          recvEnd: -1,
        };
      }
    }
  });

  chrome.debugger.onEvent.addListener(function (debuggeeId, message, params) {
    if (message === "Network.dataReceived") {
      console.log("Data received IGUESS: ", params);
      const id = params.requestId;
      if (requestInfo[id]) {
        console.log("Data received: ", params);
        requestInfo[id].size +=
          params.encodedDataLength !== 0
            ? params.encodedDataLength
            : params.dataLength;
        requestInfo[id].recvEnd = params.timestamp;
        saveRequestData(requestInfo[id]);
      }
    }
  });

  chrome.debugger.onEvent.addListener(function (debuggeeId, message, params) {
    if (message === "Network.responseReceived") {
      const id = params.requestId;
      if (requestInfo[id]) {
        console.log("Response received: ", params.response);
        console.log("Data size:", requestInfo[params.requestId].size);
        // Retrieve the request start time and compute latency
        const startTime = requestInfo[id].startTime;
        const endTime = params.timestamp;
        const latency = endTime - startTime;
        let size = requestInfo[params.requestId].size;
        if (size == 0 && params.response.encodedDataLength > 0) {
          size = params.response.encodedDataLength;
        }
        const local_protocols = ["file", "chrome-extension"];
        if (size === 0 && local_protocols.includes(params.response.protocol)) {
          size = "(Local resource)";
        }
        requestInfo[id].latency = (latency * 1000).toFixed(4);
        requestInfo[id].status = params.response.status;
        requestInfo[id].type = params.type;
        requestInfo[id].timing = params.response.timing;

        let recvStart = params.response.timing
          ? params.response.timing.requestTime 
          + params.response.timing.receiveHeadersEnd / 1000
          : params.timestamp;
        // recvStart = (recvStart / 1000).toFixed(4);
        requestInfo[id].recvStart = recvStart;

        // Save the data in chrome storage
        saveRequestData(requestInfo[id]);

        // delete requestTimes[params.requestId];
      }
    }
  });
}

function saveRequestData(requestData) {
  chrome.storage.local.get({ networkData: [] }, function (result) {
    const networkData = result.networkData;
    const index = networkData.findIndex(item => item.id === requestData.id);

    if (index !== -1) {
      networkData[index] = requestData;
      console.log('replacing', index, ' with ', requestData);
    } else {
      console.log('pushing');
      networkData.push(requestData);
    }
    chrome.storage.local.set({ networkData: networkData }, function () {
      console.log("Network request data saved:", networkData);
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
      debugee = "NO NETWORK";
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
  debugee = "NO NETWORK";
}

export function stopNetwork() {
  if (debugee && debugee != "NO NETWORK") {
    chrome.debugger.sendCommand(debugee, "Network.disable", () => {
      // console.log(debugee);
      console.log("Network disabled");
      // chrome.debugger.detach(debugee);
      chrome.runtime.sendMessage({ action: "networkDataSaved" });
      detachDebugger();
      console.log("Debugger detached");
      debugee = null;
    });
  } else if (debugee == "NO NETWORK") {
    chrome.runtime.sendMessage({ action: "networkDataNotFound" });
    debugee = null;
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
  const headers = [
    "URL",
    "Method",
    "Status",
    "Initiator",
    "Type",
    "Size",
    "Latency",
    "Waterfall",
  ];

  headers.forEach((headerText) => {
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

const colors = [
  "#faf2a1",
  "#10a4ae",
  "#082c96",
  "#61b3d6",
  "#e1775d",
  "#d35ca3",
  "#f1b0e8",
  "#d5f5b0",
  "#5f932c",
];

function drawRows(tbody, networkData) {
  networkData.forEach((requestData) => {
    const row = tbody.insertRow();

    const nameCell = row.insertCell(0);
    const methodCell = row.insertCell(1);
    const statusCell = row.insertCell(2);
    const initiatorCell = row.insertCell(3);
    const typeCell = row.insertCell(4);
    const sizeCell = row.insertCell(5);
    const timeCell = row.insertCell(6);
    const waterfallCell = row.insertCell(7);

    nameCell.textContent = requestData.url; // Just the file name
    methodCell.textContent = requestData.method;
    statusCell.textContent = requestData.status;
    initiatorCell.textContent = requestData.initiator;
    typeCell.textContent = requestData.type;
    sizeCell.textContent = `${(requestData.size / 1024).toFixed(2)} KB`; // Convert size to KB
    timeCell.textContent = `${requestData.latency} ms`;
    const timing = requestData.timing;
    let phases = [];
    if (timing) {
      phases = [
        {
          start: timing.proxyStart,
          end: timing.proxyEnd,
          color: colors[0],
          label: "Proxy",
        }, // Proxy
        {
          start: timing.dnsStart,
          end: timing.dnsEnd,
          color: colors[1],
          label: "DNS",
        }, // DNS
        {
          start: timing.connectStart,
          end: timing.connectEnd,
          color: colors[2],
          label: "Connect",
        }, // Connect
        {
          start: timing.sslStart,
          end: timing.sslEnd,
          color: colors[3],
          label: "SSL",
        }, // SSL
        {
          start: timing.workerStart,
          end: timing.workerReady,
          color: colors[4],
          label: "Worker Start/Ready",
        }, // Worker Start/Ready
        {
          start: timing.workerFetchStart,
          end: timing.workerRespondWithSettled,
          color: colors[5],
          label: "Worker Fetch/Respond",
        }, // Worker Fetch/Respond
        {
          start: timing.sendStart,
          end: timing.sendEnd,
          color: colors[6],
          label: "Send Request",
        }, // Send Request
        {
          start: timing.pushStart,
          end: timing.pushEnd,
          color: colors[7],
          label: "Push Request",
        }, // Push Request
        {
          start: timing.receiveHeadersStart,
          end: timing.receiveHeadersEnd,
          color: colors[8],
          label: "Receive Headers",
        }, // Receive Headers
      ];
    } else {
      phases.push({
        start: requestData.recvStart / 1000,
        end: requestData.recvEnd / 1000,
        color: colors[7],
        label: "Receiving",
      });
    }

    // Create the waterfall bar
    const maxWidth = 150; // Set a maximum width for the bars
    // const scaleFactor = Math.min(maxWidth / requestData.latency, 1); // Scale factor based on latency
    const scaleFactor = 1;

    // const validPhases = phases.filter(phase => phase.start >= 0 && phase.end >= 0 && phase.end > phase.start);
    const validPhases = phases;
    const totalDuration = validPhases.reduce(
      (acc, phase) => acc + (phase.end - phase.start),
      0,
    );

    const barContainer = document.createElement("div");
    barContainer.style.display = "flex";
    barContainer.style.height = "100%";
    barContainer.style.alignItems = "center";

    validPhases.forEach((phase) => {
      const phaseDuration = phase.end - phase.start;
      const bar = document.createElement("div");
      bar.className = "bar";
      bar.style.width = `${(phaseDuration / totalDuration) * 100}%`;
      bar.style.height = "10px";
      bar.style.backgroundColor = phase.color;
      bar.style.marginRight = "2px";
      bar.title = `${phase.label}: ${phase.start}ms to ${phase.end}ms`;

      barContainer.appendChild(bar);
    });

    barContainer.style.width = `300px`;
    waterfallCell.appendChild(barContainer);

    // Style the row
    [
      nameCell,
      methodCell,
      statusCell,
      initiatorCell,
      typeCell,
      sizeCell,
      timeCell,
      waterfallCell,
    ].forEach((cell) => {
      cell.style.border = "1px solid " + BORDER_COLOR;
      cell.style.padding = "8px";
    });
  });
}
