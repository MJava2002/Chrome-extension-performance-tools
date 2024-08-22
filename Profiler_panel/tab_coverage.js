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

export async function runContentScriptCoverage(tabId) {
  try {
    await chrome.debugger.attach({ tabId: tabId }, '1.3', async () => {
      if (chrome.runtime.lastError) {
          console.error('Failed to attach debugger:', chrome.runtime.lastError.message);
          return;
      }
  
      console.log('Debugger attached successfully.');
  
      // Now that the debugger is attached, start profiling
      await startProfilerForCoverage(tabId);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("here1")
      const coverageData = await stopProfilerAndCollectCoverage(tabId);
      console.log("here2")
      let uniqueFiles = new Set();
      coverageData.result.forEach((script) => {
      if (script.url != '' && !uniqueFiles.has(script.url) && checkValidUrl(script.url)) {
        uniqueFiles.add(script.url);
      }
    });
    console.log(uniqueFiles)
    //proccessFiles(uniqueFiles, coverageData);
    // Example usage:
    let fetchRes = fetch(
      "chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/scripts/inpage.js");
          
      // FetchRes is the promise to resolve
      // it by using.then() method
      fetchRes.then(res =>
          res.json()).then(d => {
              console.log(d)
          })
  });
  } catch (error) {
    console.error("Error during coverage analysis:", error);
  }
}


function getFileCharacterCount(filePath, callback) {
  chrome.runtime.getPackageDirectoryEntry(function(directoryEntry) {
      directoryEntry.getFile(filePath, {}, function(fileEntry) {
          fileEntry.file(function(file) {
              const reader = new FileReader();
              reader.onloadend = function() {
                  const content = reader.result;
                  callback(content.length);
              };
              reader.readAsText(file);
          });
      });
  });
}
