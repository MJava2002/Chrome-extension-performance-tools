console.log('Service worker loaded');

const extensionId = "gighmmpiobklfepjocnamgkkbiglidom";
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

// Function to start coverage for the extension's background page
async function startExtensionCoverage() {
    // Get the background page target for your extension
    const targets = await chrome.debugger.getTargets();
    const backgroundPage = targets.find(target => target.type === 'worker' && target.url.includes(extensionId));

    if (!backgroundPage) {
        console.error('Background page not found.');
        return;
    }

    // Attach the debugger to the background page
    await chrome.debugger.attach({ targetId: backgroundPage.id }, "1.3");

    // Enable the profiler
    await chrome.debugger.sendCommand({ targetId: backgroundPage.id }, "Profiler.enable");

    // Start precise coverage
    await chrome.debugger.sendCommand({ targetId: backgroundPage.id }, "Profiler.startPreciseCoverage", {
        callCount: true,
        detailed: true
    });

    console.log("Coverage started for the extension's background page.");
}

// Function to stop and collect coverage data
async function stopAndCollectExtensionCoverage() {
    const targets = await chrome.debugger.getTargets();
    const backgroundPage = targets.find(target => target.type === 'worker' && target.url.includes(extensionId));

    if (!backgroundPage) {
        console.error('Background page not found.');
        return;
    }

    // Collect the coverage data
    const coverageData = await chrome.debugger.sendCommand({ targetId: backgroundPage.id }, "Profiler.takePreciseCoverage");

    // Stop precise coverage
    await chrome.debugger.sendCommand({ targetId: backgroundPage.id }, "Profiler.stopPreciseCoverage");

    // Disable the profiler
    await chrome.debugger.sendCommand({ targetId: backgroundPage.id }, "Profiler.disable");

    // Detach the debugger
    await chrome.debugger.detach({ targetId: backgroundPage.id });

    console.log("Coverage data collected for the extension's background page:", coverageData);
}

function getLastSegmentFromUrl(url) {
    try {
        // Create a URL object to parse the URL
        const urlObj = new URL(url);

        // Check if the URL has the pattern "chrome-extension://<extension-id>/something"
        if (urlObj.protocol === 'chrome-extension:' && urlObj.pathname) {
            // Split the pathname by '/' and get the last segment
            const segments = urlObj.pathname.split('/');
            const lastSegment = segments.pop(); // Get the last segment

            // Return the last segment
            return lastSegment;
        } else {
            // Return the original URL if it does not match the pattern
            return url;
        }
    } catch (error) {
        console.error('Invalid URL:', error);
        return url; // Return the original URL if there is an error
    }
}


async function runCoverage() {
    startExtensionCoverage();
    // Collect coverage after a delay or based on some event
    let coverageData;
    setTimeout(() => {
        stopAndCollectExtensionCoverage().then(coverage => {
            console.log("Final Coverage Data:", coverage);
            coverageData = coverage;
        });
    }, 5000);  // Adjust delay as needed
    const uniqueFiles = new Set();
    coverageData.result.forEach(script => {
        const fileName = getLastSegmentFromUrl(script.url);
        if (!uniqueFiles.has(fileName)) {
            uniqueFiles.add(fileName)
        }
    });

}
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "buttonClicked") {
        console.log("Run coverage button clicked")
        runCoverage();   
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
                console.log("first ", result)
                let target = result.find(t =>
                    t.title.includes(extensionId)
                );
                console.log("second", result)
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


async function calculateCoveragePercentage(scriptUrl, coverageData) {
    try {
        // Fetch the content of the script from the URL
        const response = await fetch(scriptUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch script content from ${scriptUrl}`);
        }
        const scriptContent = await response.text();

        // Get the total script size
        const totalScriptSize = scriptContent.length;

        // Sum the covered bytes
        let coveredBytes = 0;
        coverageData.result.forEach(script => {
            if (script.url === scriptUrl) {
                script.functions.forEach(func => {
                    func.ranges.forEach(range => {
                        coveredBytes += (range.endOffset - range.startOffset);
                    });
                });
            }
        });

        // Calculate the coverage percentage
        const coveragePercentage = (coveredBytes / totalScriptSize) * 100;

        // Log the results
        console.log(`Total Script Size: ${totalScriptSize} bytes`);
        console.log(`Covered Bytes: ${coveredBytes} bytes`);
        console.log(`Coverage Percentage: ${coveragePercentage.toFixed(2)}%`);

        // Return the percentage for further use
        return coveragePercentage;

    } catch (error) {
        console.error('Error calculating coverage percentage:', error);
        throw error; // Re-throw the error to handle it externally if needed
    }
}