export function proccessFiles(uniqueFiles, coverageData) {
  uniqueFiles = [...uniqueFiles];
  console.log(uniqueFiles);
  // Promise.all(fetch(url).then( r => r.text() ).then( t => content += t))
  Promise.all(
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
  )
    .then((data) => {
      console.log(data);
      data.forEach((fileData) => {
        const { url, content } = fileData;
        calculateCoveragePercentage(content.length, coverageData, url);
      });
    })
    .catch((e) => {
      console.error("Error during Promise.all:", e);
    });
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
    console.error("Invalid URL:", error);
    return false;
  }
}

export async function calculateCoveragePercentage(
  totalScriptSize,
  coverageData,
  scriptUrl,
) {
  let ranges = []
  coverageData.result.forEach((script) => {
    if (script.url === scriptUrl) {
      script.functions.forEach((func) => {
        // [...list1, ...list2];
        const tmp = func.ranges.map(({ startOffset, endOffset }) => [startOffset, endOffset])
        ranges = [...ranges, ...tmp]
      });
    }
  });
  const coveredBytes = countCoveredNumbers(ranges)
  const coveragePercentage = (coveredBytes / totalScriptSize) * 100;
  console.log(`Total Script Size: ${totalScriptSize} bytes`);
  console.log(`Covered Bytes: ${coveredBytes} bytes`);
  console.log(`Coverage Percentage: ${coveragePercentage.toFixed(2)}%`);

  return coveragePercentage;
}

// ranges is a list of [start,end] numbers
export function countCoveredNumbers(ranges) {
  let events = [];

  ranges.forEach(([start, end]) => {
    events.push([start, 1]);
    events.push([end + 1, -1]);
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
