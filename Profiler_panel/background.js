console.log('Service worker loaded');

const extensionId = "abagcohagdfbmahemkbfckhnnibicafe";
var tabId;
function isExtensionNode(node) {
    return node.callFrame.url.includes(extensionId);
}
function sendToDevTools(message) {
    chrome.runtime.sendMessage({
        target: 'devtools',
        message: message
    });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "buttonClicked") {
        console.log("Run coverage button clicked")
  }
});


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "runExtensionClicked") {
        profileWithExtensionID()
    }
    if (request.action === "runTabClicked") {
        profileWithTabID()
    }
});

function profileWithTabID() {
    sendToDevTools("Tab ID in DevTools panel!");
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
          let activeTab = tabs[0];
          sendToDevTools("Active Tab ID: " + activeTab.id);
          tabId = activeTab.id;
          chrome.debugger.attach({ tabId: tabId }, '1.3', async function () {
                if (chrome.runtime.lastError) {
                    sendToDevTools("Error: " + chrome.runtime.lastError.message);
                    return;
                }
                sendToDevTools('Debugger attached');

                chrome.debugger.sendCommand({ tabId: tabId }, 'Profiler.enable', () => {
                    sendToDevTools('Profiler enabled');
                });

                chrome.debugger.sendCommand({ tabId: tabId }, 'Profiler.start', () => {
                    sendToDevTools('Profiler started');
                });

                await new Promise(r => setTimeout(r, 3000));

                chrome.debugger.sendCommand({ tabId: tabId }, 'Profiler.stop', (result) => {
                    sendToDevTools('Profiler stopped');
                    const profile = result.profile;

                    function processProfileData(profile) {
    // This is a simplified version. You might need to adjust this based on the actual structure of your profile data
                        function processNode(node) {
                            let result = {
                                name: node.callFrame.functionName || '(anonymous)',
                                value: node.selfSize || 1,
                                children: []
                            };
                            if (node.children) {
                                node.children.forEach(childId => {
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
                        type: 'flameGraphData',
                        data: flameGraphData
                    });
                });
          });
        });
}

function profileWithExtensionID() {
    const extensionId = "gighmmpiobklfepjocnamgkkbiglidom"
    sendToDevTools("Extension ID in DevTools panel!");
    chrome.debugger.getTargets((result) => {
        sendToDevTools(result)
        let target = result.find(t =>
            t.title.includes(extensionId)
        );
        if (target) {
            targetId = target.id;
            chrome.debugger.attach({targetId: targetId}, '1.3', async function () {
                if (chrome.runtime.lastError) {
                    sendToDevTools("Error: " + chrome.runtime.lastError.message);
                    return;
                }
                sendToDevTools('Debugger attached');

                // Enable the debugger and profiler
                chrome.debugger.sendCommand({targetId: targetId}, 'Debugger.enable', () => {
                    sendToDevTools('Debugger enabled');
                });

                chrome.debugger.sendCommand({targetId: targetId}, 'Profiler.enable', () => {
                    sendToDevTools('Profiler enabled');
                });

                chrome.debugger.sendCommand({targetId: targetId}, 'Profiler.start', () => {
                    sendToDevTools('Profiler started');
                });

                // Wait for 2 seconds
                await new Promise(r => setTimeout(r, 2000));

                chrome.debugger.sendCommand({targetId: targetId}, 'Profiler.stop', (result) => {
                    sendToDevTools('Profiler stopped');
                    sendToDevTools('Profile nodes: ' + JSON.stringify(result.profile.nodes));

                });
            });
        } else {
            sendToDevTools("Target not found.");
        }
    });
}