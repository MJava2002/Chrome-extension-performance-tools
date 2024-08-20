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

async function runContentScriptCoverage(tabId) {
  try {
    await startProfilerForCoverage(tabId);
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const coverageData = await stopProfilerAndCollectCoverage(tabId);
    let uniqueFiles = new Set();
    coverageData.result.forEach((script) => {
      if (!uniqueFiles.has(script.url) && checkValidUrl(script.url)) {
        uniqueFiles.add(script.url);
      }
    });
    proccessFiles(uniqueFiles, coverageData);
  } catch (error) {
    console.error("Error during coverage analysis:", error);
  }
}
