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
    sendToDevTools("Button clicked in DevTools panel!");
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
//
// chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
//   if (request.action === "buttonClicked") {
//     console.log("Button clicked in DevTools panel!");
//     chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
//       // The tabs array contains only one tab, the active one
//       let activeTab = tabs[0];
//       console.log("Active Tab ID:", activeTab.id);
//       tabId = activeTab.id;
//       chrome.debugger.attach({ tabId: tabId }, '1.3', async function () {
//             if (chrome.runtime.lastError) {
//                 console.error(chrome.runtime.lastError.message);
//                 return;
//             }
//             console.log('Debugger attached');
//
//             // Enable debugger
//             chrome.debugger.sendCommand({ tabId: tabId }, 'Profiler.enable', () => {
//                 console.log('Profiler enabled');
//             });
//
//             chrome.debugger.sendCommand({ tabId: tabId }, 'Profiler.start', () => {
//                 console.log('Profiler started');
//             });
//
//             //sleep
//             await new Promise(r => setTimeout(r, 3000));
//
//             chrome.debugger.sendCommand({ tabId: tabId }, 'Profiler.stop', (result) => {
//                 console.log('Profiler stopped');
//                 const profile = result.profile;
//                 console.log(profile.nodes);
//                 const nodes = profile.nodes.filter(isExtensionNode);
//                 console.log(nodes);
//             });
//
//       });
//     });
//   }
// });

// const coverageButton = createButton();
// coverageButton.addEventListener('click', function () {
//   chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
//     const tabId = tabs[0].id;
//
//     chrome.debugger.attach({ tabId: tabId }, '1.3', async function () {
//       if (chrome.runtime.lastError) {
//         console.error(chrome.runtime.lastError.message);
//         return;
//       }
//       console.log('Debugger attached');
//
//       // Enable debugger
//       chrome.debugger.sendCommand({ tabId: tabId }, 'Debugger.enable', () => {
//         console.log('Debugger enabled');
//       });
//
//       chrome.debugger.sendCommand({ tabId: tabId }, 'Profiler.enable', () => {
//         console.log('Profiler enabled');
//       });
//
//       chrome.debugger.sendCommand({ tabId: tabId }, 'Profiler.start', () => {
//         console.log('Profiler started');
//       });
//
//       // Wait for some time to collect profile
//       await new Promise(r => setTimeout(r, 2000));
//
//       chrome.debugger.sendCommand({ tabId: tabId }, 'Profiler.stop', (result) => {
//         console.log('Profiler stopped');
//         console.log(result.profile);
//
//         // Send results to the DevTools panel
//         chrome.runtime.sendMessage({ type: 'profiler-result', profile: result.profile });
//       });
//
//       // Detach debugger when done
//       chrome.debugger.detach({ tabId: tabId }, () => {
//         if (chrome.runtime.lastError) {
//           console.error(chrome.runtime.lastError.message);
//         } else {
//           console.log('Debugger detached');
//         }
//       });
//     });
//   });
// });
