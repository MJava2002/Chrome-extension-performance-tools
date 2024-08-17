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
        sendToDevTools("Extension ID in DevTools panel!");
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            let activeTab = tabs[0];
            sendToDevTools("Active Tab ID: " + activeTab.id);
            tabId = activeTab.id;
            chrome.debugger.getTargets((result) => {
                sendToDevTools(result)
                let target = result.find(t =>
                    t.title.includes(extensionId)
                );
                if (target) {
                    tabId = targetTab.id;
                    chrome.debugger.attach({tabId: tabId}, '1.3', async function () {
                        if (chrome.runtime.lastError) {
                            sendToDevTools("Error: " + chrome.runtime.lastError.message);
                            return;
                        }
                        sendToDevTools('Debugger attached');

                        // Enable the debugger and profiler
                        chrome.debugger.sendCommand({tabId: tabId}, 'Debugger.enable', () => {
                            sendToDevTools('Debugger enabled');
                        });

                        chrome.debugger.sendCommand({tabId: tabId}, 'Profiler.enable', () => {
                            sendToDevTools('Profiler enabled');
                        });

                        chrome.debugger.sendCommand({tabId: tabId}, 'Profiler.start', () => {
                            sendToDevTools('Profiler started');
                        });

                        // Wait for 2 seconds
                        await new Promise(r => setTimeout(r, 2000));

                        chrome.debugger.sendCommand({tabId: tabId}, 'Profiler.stop', (result) => {
                            sendToDevTools('Profiler stopped');
                            sendToDevTools('Profile nodes: ' + JSON.stringify(result.profile.nodes));

                        });
                    });
                } else {
                    sendToDevTools("No HTTP tabs found.");
                }
            });
        });
    }
    if (request.action === "runTabClicked") {
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
                    sendToDevTools('Profile nodes: ' + JSON.stringify(profile.nodes));
                    const nodes = profile.nodes.filter(isExtensionNode);
                    sendToDevTools('Extension nodes: ' + JSON.stringify(nodes));
                });
          });
        });
    }
});
