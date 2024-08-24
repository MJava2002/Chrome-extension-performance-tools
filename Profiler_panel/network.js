let id;
let debugee;

function startRequestMonitoring() {
    let requestTimes = {};

    chrome.debugger.onEvent.addListener(function(debuggeeId, message, params) {
        const pattern = `chrome-extension://${id}`
        if (message === "Network.requestWillBeSent") {
            console.log("Request intercepted: ", params);
            if (params.initiator.stack && params.initiator.stack.callFrames[0].url.startsWith(pattern)) {
                console.log("Extension request: ", params.request);
                requestTimes[params.requestId] = {
                    startTime: params.timestamp,
                    url: params.request.url
                };
            }
        }
    });

    chrome.debugger.onEvent.addListener(function(debuggeeId, message, params) {
        if (message === "Network.responseReceived") {
            console.log("Response received: ", params.response);
            if (requestTimes[params.requestId]) {
                // Retrieve the request start time and compute latency
                const startTime = requestTimes[params.requestId].startTime;
                const endTime = params.timestamp;
                const latency = endTime - startTime;

                // Log latency
                console.log(`Latency of request to ${requestTimes[params.requestId].url}: ${latency.toFixed(4)} seconds`);
            }
        }
    });
}


export function startNetwork(extensionId) {
    id = extensionId;
    chrome.debugger.getTargets((result) => {
        console.log(result);
        let target = result.find((t) => t.title.includes(extensionId));
  
        if (target) {
          const targetId = target.id;
          debugee = {targetId: targetId};
          console.log("Found target:", target);
          chrome.debugger.attach(
            { targetId: targetId },
            "1.3",
            async function () {
              if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
                return;
              }
              console.log("Debugger attached");
  
              // Enable debugger
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
            },
          );
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
        debugee = {tabId: tabId};
        chrome.debugger.attach({ tabId: tabId }, "1.3", async function () {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
                return;
            }
            // Enable debugger
            chrome.debugger.sendCommand(
                { tabId: tabId },
                "Debugger.enable",
                () => {
                  console.log("Debugger enabled");
                },
              );

              chrome.debugger.sendCommand(
                { tabId: tabId },
                "Network.enable",
                () => {
                  console.log("Network enabled");
                },
              );
  
              startRequestMonitoring();
        });
    });
}

export function stopNetwork() {
    if (debugee) {
        chrome.debugger.sendCommand(
            debugee,
            "Network.disable",
            () => {
              console.log("Network disabled");
              chrome.debugger.detach(debugee);
              console.log("Debugger detached");
              debugee = null;
            },
        );
    }
}