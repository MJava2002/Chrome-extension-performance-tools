import { transformProfileData } from "./profileUtils.js";

export function tabProfileForFlameGraph() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    let activeTab = tabs[0];
    console.log("Active Tab ID: " + activeTab.id);
    tabId = activeTab.id;
    chrome.debugger.attach({ tabId: tabId }, "1.3", async function () {
      if (chrome.runtime.lastError) {
        console.log("Error: " + chrome.runtime.lastError.message);
        return;
      }
      console.log("Debugger attached");

      chrome.debugger.sendCommand({ tabId: tabId }, "Profiler.enable", () => {
        console.log("Profiler enabled");
      });

      chrome.debugger.sendCommand({ tabId: tabId }, "Profiler.start", () => {
        console.log("Profiler started");
      });

      await new Promise((r) => setTimeout(r, 3000));

      chrome.debugger.sendCommand(
        { tabId: tabId },
        "Profiler.stop",
        (result) => {
          const profile = result.profile;
          const transformedData = transformProfileData(profile);
          console.log("Before saving", profile);
          const jsonData = JSON.stringify(transformedData, null, 2);

          chrome.storage.local.set({ myJsonData: jsonData }, function () {
            chrome.runtime.sendMessage({ action: "dataSaved" });
          });
        },
      );
    });
  });
}
