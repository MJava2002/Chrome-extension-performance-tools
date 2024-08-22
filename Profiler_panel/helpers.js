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
export function getLastSegmentFromUrl(url) {
  try {
    const urlObj = new URL(url);

    if (checkValidUrl(url)) {
      const segments = urlObj.pathname.split("/");
      const lastSegment = segments.pop();
      return lastSegment;
    }
  } catch (error) {
    console.error("Invalid URL:", error);
    return url;
  }
}

export function checkValidUrl(url) {
  const urlObj = new URL(url);
  return urlObj.protocol === "chrome-extension:" && urlObj.pathname;
}

export async function calculateCoveragePercentage(
  totalScriptSize,
  coverageData,
  scriptUrl,
) {
  let coveredBytes = 0;
  coverageData.result.forEach((script) => {
    if (script.url === scriptUrl) {
      script.functions.forEach((func) => {
        func.ranges.forEach((range) => {
          coveredBytes += range.endOffset - range.startOffset;
        });
      });
    }
  });

  const coveragePercentage = (coveredBytes / totalScriptSize) * 100;
  console.log(`Total Script Size: ${totalScriptSize} bytes`);
  console.log(`Covered Bytes: ${coveredBytes} bytes`);
  console.log(`Coverage Percentage: ${coveragePercentage.toFixed(2)}%`);

  return coveragePercentage;
}
