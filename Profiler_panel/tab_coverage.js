import { checkValidUrl, proccessFiles } from "./helpers.js";

async function startProfilerForCoverage(tabId) {
  await chrome.debugger.sendCommand({ tabId }, "Profiler.enable");
  await chrome.debugger.sendCommand(
    { tabId },
    "Profiler.startPreciseCoverage",
    {
      callCount: false,
      detailed: true,
    },
  );
  console.log("Profiler started for precise coverage.");
}

async function stopProfilerAndCollectCoverage(tabId) {
  const coverageData = await chrome.debugger.sendCommand(
    { tabId },
    "Profiler.takePreciseCoverage",
  );
  await chrome.debugger.sendCommand({ tabId }, "Profiler.stopPreciseCoverage");
  await chrome.debugger.sendCommand({ tabId }, "Profiler.disable");
  console.log("Profiler stopped and coverage data collected.");
  return coverageData;
}

export async function runContentScriptCoverage(tabId, extensionId) {
  try {
    // Attach the debugger to the tab
    await new Promise((resolve, reject) => {
      chrome.debugger.attach({ tabId }, "1.3", () => {
        if (chrome.runtime.lastError) {
          reject(new Error("Failed to attach debugger: " + chrome.runtime.lastError.message));
        } else {
          console.log("Debugger attached successfully.");
          resolve();
        }
      });
    });

    // Start profiling
    await startProfilerForCoverage(tabId);

    // Wait for a specified time to collect coverage data
    await new Promise(resolve => setTimeout(resolve, 40000));

    // Stop profiling and collect coverage data
    const coverageData = await stopProfilerAndCollectCoverage(tabId);

    // Process the coverage data
    let uniqueFiles = new Set();
    coverageData.result.forEach((script) => {
      if (script.url && !uniqueFiles.has(script.url) && checkValidUrl(script.url, extensionId)) {
        uniqueFiles.add(script.url);
      }
    });

    console.log("Coverage Data:", coverageData);
    console.log("Unique Files:", uniqueFiles);
    console.log("Extension ID:", extensionId);

    // Process the collected files
    const mapData = await proccessFiles(uniqueFiles, coverageData, extensionId);
    console.log('runContentScriptCoverage', mapData)
    return mapData

  } catch (error) {
    console.error("Error during coverage analysis:", error);
    return null; // Return null or appropriate value if there's an error
  } finally {
    // Detach the debugger in case of error or successful completion
    try {
      await new Promise((resolve, reject) => {
        chrome.debugger.detach({ tabId }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error("Failed to detach debugger: " + chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      });
    } catch (error) {
      console.error("Error detaching debugger:", error);
    }
  }
}
