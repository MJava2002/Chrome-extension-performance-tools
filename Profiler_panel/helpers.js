export async function proccessFiles(uniqueFiles, coverageData, extensionId) {
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
      );
      console.log(
        "in process file",
        covered,
        getLastSegmentFromUrl(url_1, extensionId),
      );
      percentPerFile.push({
        fileName: getLastSegmentFromUrl(url_1, extensionId),
        bytesCovered: covered.coveredBytes,
        percentageCovered: covered.coveragePercentage,
      });
    });
    console.log("processFile", percentPerFile);
    return percentPerFile;
  } catch (e) {
    console.error("Error during Promise.all:", e);
    return percentPerFile;
  }
}
// i will use this in graphs
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
    // Check if the protocol is chrome-extension:
    const isValidProtocol = urlObj.protocol === "chrome-extension:";
    // Return true if both conditions are met
    return isValidProtocol && containsId;
  } catch (error) {
    //console.error("Invalid URL:", error);
    return false;
  }
}

export function calculateCoveragePercentage(
  totalScriptSize,
  coverageData,
  scriptUrl,
) {
  let ranges = [];
  coverageData.result.forEach((script) => {
    if (script.url === scriptUrl) {
      script.functions.forEach((func) => {
        // [...list1, ...list2];
        const tmp = func.ranges.map(({ startOffset, endOffset }) => [
          startOffset,
          endOffset,
        ]);
        ranges = [...ranges, ...tmp];
      });
    }
  });
  const coveredBytes = countCoveredNumbers(ranges);
  const coveragePercentage = (coveredBytes / totalScriptSize) * 100;
  console.log(`Total Script Size: ${totalScriptSize} bytes`);
  console.log(`Covered Bytes: ${coveredBytes} bytes`);
  console.log(`Coverage Percentage: ${coveragePercentage.toFixed(2)}%`);

  return { coveragePercentage, coveredBytes };
}

// ranges is a list of [start,end] numbers
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

// def count_covered_numbers(ranges):
//     events = []
//     for start, end in ranges:
//         events.append((start, 1))
//         events.append((end + 1, -1))

//     events.sort()

//     count = 0
//     active_ranges = 0
//     total_covered = 0

//     for point, event_type in events:
//         if active_ranges > 0:
//             total_covered += point - count

//         active_ranges += event_type
//         count = point

//     return total_covered

export function setAttached(target) {
  chrome.storage.local.set({ attachedTarget: target }, () => {
    console.log("attachedTarget value set to ", target);
  });
}

// Detach debugger using the stored target
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
          chrome.runtime.onMessage.removeListener(listener); // Clean up the listener
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
        resolve(result.activeId || ""); // Resolve with the retrieved ID or an empty string if not found
      }
    });
  });
}
