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

function analyzeCoverageData(coverageData) {
  coverageData.result.forEach((script) => {
    if (script.url.startsWith("chrome-extension://")) {
      let totalBytes = 0;
      let coveredBytes = 0;

      script.functions.forEach((func) => {
        func.ranges.forEach((range) => {
          totalBytes += range.endOffset - range.startOffset;
          if (range.count > 0) {
            coveredBytes += range.endOffset - range.startOffset;
          }
        });
      });

      const coveragePercentage = (coveredBytes / totalBytes) * 100;
      console.log(
        `Coverage for ${script.url}: ${coveragePercentage.toFixed(2)}%`,
      );
    }
  });
}

// const tabId = <Your Tab ID Here>;

async function runContentScriptCoverage(tabId) {
  try {
    await startProfilerForCoverage(tabId);
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const coverageData = await stopProfilerAndCollectCoverage(tabId);
    analyzeCoverageData(coverageData);
  } catch (error) {
    console.error("Error during coverage analysis:", error);
  }
}
