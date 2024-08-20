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
    console.log(backgroundPage.id)
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

    return coverageData;
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
        }
    } catch (error) {
        console.error('Invalid URL:', error);
        return url; // Return the original URL if there is an error
    }
}

function proccessFiles(uniqueFiles, coverageData) {
    uniqueFiles = [...uniqueFiles]
       // Promise.all(fetch(url).then( r => r.text() ).then( t => content += t))
       Promise.all(uniqueFiles.map(url =>
        fetch(url)
            .then(async response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${url}. Status: ${response.status}`);
                }
                const content = await response.text();
                return ({ url, content });
            })
            .catch(error => {
                console.error(`Error fetching ${url}:`, error.message);
                return { url, content: '' }; // Return the URL with an empty content string on failure
            })
    )).then(data => {
        console.log(data);
    
        // Now you can iterate through the data array and pass both the url and content length
        data.forEach(fileData => {
            const { url, content } = fileData;
            calculateCoveragePercentage(content.length, coverageData, url);
        });
    }).catch(e => {
        console.error('Error during Promise.all:', e);
    });
}

async function runCoverage() {
    await startExtensionCoverage();
    // Collect coverage after a delay or based on some event
    let coverageData;
    await new Promise(r => setTimeout(r, 7000));
    coverageData = await stopAndCollectExtensionCoverage()
    // setTimeout(() => {
    //     stopAndCollectExtensionCoverage().then(coverage => {
    //         console.log("Final Coverage Data:", coverage);
    //         console.log(coverage)
    //         coverageData = coverage;
    //     });
    // }, 5000);  // Adjust delay as needed
    let uniqueFiles = new Set();
    coverageData.result.forEach(script => {
        if (!uniqueFiles.has(script.url)) {
            uniqueFiles.add(script.url)
        }
    });
    proccessFiles(uniqueFiles, coverageData)
}
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "buttonClicked") {
        console.log("Run coverage button clicked")
        runCoverage();   
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


async function calculateCoveragePercentage(totalScriptSize, coverageData, scriptUrl) {
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