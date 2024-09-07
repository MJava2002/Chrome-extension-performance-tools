export async function proccessFiles(uniqueFiles, coverageData, extensionId, isTab = true) {
  uniqueFiles = [...uniqueFiles];
  const percentPerFile = [];
  console.log(uniqueFiles);

  try {
    const data = await Promise.all(
      uniqueFiles.map((url) =>
        fetch(url)
          .then(async (response) => {
            if (!response.ok) {
              throw new Error(
                `Failed to fetch ${url}. Status: ${response.status}`,
              );
            }
            const content = await response.text();
            return { url, content };
          })
          .catch((error) => {
            console.error(`Error fetching ${url}:`, error.message);
            return { url, content: "" };
          }),
      ),
    );
    console.log(data);
    data.forEach((fileData) => {
      const { url: url_1, content: content_1 } = fileData;
      const covered = calculateCoveragePercentage(
        content_1.length,
        coverageData,
        url_1,
        isTab
      );
      console.log("in process file", coverageData);
      if(covered.coveredBytes != 0){
        percentPerFile.push({
          fileName: getLastSegmentFromUrl(url_1, extensionId),
          bytesCovered: covered.coveredBytes,
          percentageCovered: covered.coveragePercentage.toFixed(2),
          content: content_1,
          ranges: covered.ranges,
        });
      }
    });
    console.log("processFile", percentPerFile);
    return percentPerFile;
  } catch (e) {
    console.error("Error during Promise.all:", e);
    return percentPerFile;
  }
}

export function getLastSegmentFromUrl(url, extensionId) {
  try {
    const urlObj = new URL(url);

    if (checkValidUrl(url, extensionId)) {
      const segments = urlObj.pathname.split("/");
      const lastSegment = segments.pop();
      return lastSegment;
    }
  } catch (error) {
    console.error("Invalid URL:", error);
    return url;
  }
}

export function checkValidUrl(url, id) {
  try {
    const containsId = url.includes(id);

    const urlObj = new URL(url);

    const isValidProtocol = urlObj.protocol === "chrome-extension:";

    return isValidProtocol && containsId;
  } catch (error) {

    return false;
  }
}

export function calculateCoveragePercentage(
  totalScriptSize,
  coverageData,
  scriptUrl,
  isTab = true
) {
  let ranges = [];
  coverageData.result.forEach((script) => {
    if (script.url === scriptUrl) {
      console.log("script", script);
      script.functions.forEach((func) => {
       
        const tmp = func.ranges
        .filter(({ count }) => count !== 0)
        .filter(({ startOffset, endOffset }) => {
         
          if (isTab) {
            return !(startOffset === 0 && endOffset === totalScriptSize);
          }
          return true;
        })
        .map(({ startOffset, endOffset }) => [startOffset, endOffset]);
        ranges = [...ranges, ...tmp];
      });
    }
  });
  const coveredBytes = countCoveredNumbers(ranges);
  const coveragePercentage = (coveredBytes / totalScriptSize) * 100;
  console.log(`Total Script Size: ${totalScriptSize} bytes`);
  console.log(`Covered Bytes: ${coveredBytes} bytes`);
  console.log(`Coverage Percentage: ${coveragePercentage.toFixed(2)}%`);

  return { coveragePercentage, coveredBytes, ranges };
}

export function countCoveredNumbers(ranges) {
  let events = [];

  ranges.forEach(([start, end]) => {
    events.push([start, 1]);
    events.push([end, -1]);
  });

  events.sort((a, b) => a[0] - b[0]);
  let count = 0;
  let activeRanges = 0;
  let totalCovered = 0;

  for (const [point, eventType] of events) {
    if (activeRanges > 0) {
      totalCovered += point - count;
    }

    activeRanges += eventType;
    count = point;
  }

  return totalCovered;
}

export function setAttached(target) {
  chrome.storage.local.set({ attachedTarget: target }, () => {
    console.log("attachedTarget value set to ", target);
  });
}

export async function detachDebugger() {
  chrome.storage.local.get("attachedTarget", async (result) => {
    const attachedTarget = result.attachedTarget;
    console.log("entered detach, attachedTarget value ", attachedTarget);
    if (attachedTarget) {
      try {
        await chrome.debugger.detach(attachedTarget);
        console.log("detachDebugger success");
        chrome.storage.local.remove("attachedTarget");
      } catch (error) {
        if (chrome.runtime.lastError) {
          if (chrome.runtime.lastError.message.includes("not attached")) {
            console.log("Debugger was not attached, ignoring the error.");
          } else {
            console.error(
              "Failed to detach debugger:",
              chrome.runtime.lastError.message,
            );
          }
        }
      }
    }
  });
}

export function waitForStopButtonClick() {
  return new Promise((resolve) => {
    chrome.runtime.onMessage.addListener(
      function listener(request, sender, sendResponse) {
        if (request.action === "stopButtonClicked") {
          console.log("Received button click message in background script.");
          chrome.runtime.onMessage.removeListener(listener);
          resolve();
        }
      },
    );
  });
}

export async function getId() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(["activeId"], function (result) {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError));
      } else {
        console.log("Active ID retrieved:", result.activeId);
        resolve(result.activeId || "");
      }
    });
  });
}
