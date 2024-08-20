/*
    Example of collecting trace events 
    Using the Tracing domain of Chrome Debugger API
    We call Tracing.start and finally receive traces 
    through events after calling Tracing.end
    Based on this example in the Chromium API tests:
    https://source.chromium.org/chromium/chromium/src/+/main:chrome/test/data/extensions/api_test/tracing_extension/background.js
*/

async function getTraces() {
  let traces = [];
  await new Promise((resolve) => {
    const listener = (source, method, params) => {
      if (method === "Tracing.dataCollected" && params && params.value) {
        /* collect v8 category traces for now */
        traces = traces.concat(
          params.value.filter((trace) => trace.cat.includes("v8")),
        );
      } else if (method === "Tracing.tracingComplete") {
        chrome.debugger.onEvent.removeListener(listener);
        resolve();
      }
    };
    chrome.debugger.onEvent.addListener(listener);
  });
  return traces;
}

var tabId;
chrome.action.onClicked.addListener(function (tab) {
  console.log(tab.url);
  if (tab.url.startsWith("http")) {
    tabId = tab.id;
    chrome.debugger.attach({ tabId: tabId }, "1.3", async function () {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        return;
      }
      console.log("Debugger attached");

      chrome.debugger.sendCommand(
        { tabId: tabId },
        "Tracing.getCategories",
        (result) => {
          console.log(result);
        },
      );

      // Enable debugger
      chrome.debugger.sendCommand({ tabId: tabId }, "Tracing.start", () => {
        console.log("Tracing started");
      });

      //sleep
      await new Promise((r) => setTimeout(r, 3000));

      chrome.debugger.sendCommand({ tabId: tabId }, "Tracing.end", (result) => {
        console.log("Tracing stopped");
        console.log(result);
      });

      const traces = await getIdentifiabilityTraces();
      console.log(traces);
    });
  }
});
