import { checkValidUrl } from "./helpers.js";
import { proccessFiles } from "./helpers.js";

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
    await chrome.debugger.attach({ tabId: tabId }, "1.3", async () => {
      if (chrome.runtime.lastError) {
        console.error(
          "Failed to attach debugger:",
          chrome.runtime.lastError.message,
        );
        return;
      }

      console.log("Debugger attached successfully.");

      // Now that the debugger is attached, start profiling
      await startProfilerForCoverage(tabId);
      await new Promise((resolve) => setTimeout(resolve, 4000));
      const coverageData = await stopProfilerAndCollectCoverage(tabId);
      let uniqueFiles = new Set();
      coverageData.result.forEach((script) => {
        if (
          script.url != "" &&
          !uniqueFiles.has(script.url) &&
          checkValidUrl(script.url, extensionId)
        ) {
          uniqueFiles.add(script.url);
        }
      });
      console.log(coverageData);
      console.log(uniqueFiles);
      console.log(extensionId);
      // uniqueFiles = ['chrome-extension://bmpknceehpgjajlnajokmikpknfffgmj/low_coverage_script.js']
      proccessFiles(uniqueFiles, coverageData);
      // Example usage:
    });
  } catch (error) {
    console.error("Error during coverage analysis:", error);
  }
}
