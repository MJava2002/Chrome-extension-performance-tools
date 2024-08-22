console.log("PARARARA")
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  let tab = tabs[0];

  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      files: ["node_modules/d3/d3.v7.js", "node_modules/d3-flame-graph/dist/d3-flamegraph.min.js"],
    },
    () => {
      // D3 is now available in the tab's context
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Ensure D3 is loaded before using it
          if (typeof d3 !== "undefined") {
            console.log("D3 version:", d3.version);
            const chart = flamegraph()
                .width(960)
                .cellHeight(18)
                .transitionDuration(750)
                .minFrameSize(5)
                .title("HERE LIES MY HOPES AND DREAMS")
                .label(function (d) {
                  return d.name + " (" + d.value + ")";
                });
            console.log("D3 version:", d3.version);
            console.log("Flamegraph function:", typeof flamegraph === "function");

            console.log("HERE's my chart " + chart)
            const dataUrl = chrome.runtime.getURL("data.json");
            d3.json(dataUrl)
            .then((data) => {
              console.log("Data loaded:", data);  // Check if data is loaded correctly
              d3.select("#flameGraph")
                .datum(data)
                .call(chart);
              console.log("Flame graph should now be rendered");
            })
            .catch(error => {
              console.warn("Error loading JSON:", error);
            });
            // const svgElement = document.querySelector("#flameGraph svg");
            // console.log("SVG Width:", svgElement.getAttribute("width"));
            // console.log("SVG Height:", svgElement.getAttribute("height"));
          } else {
            console.error("D3 not loaded");
          }
        },
      });
    },
  );
});
