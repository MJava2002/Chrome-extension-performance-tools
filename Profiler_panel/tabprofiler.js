import {waitForStopButtonClick, setAttached, checkValidUrl, getId} from "./helpers.js";
import { transformProfileData } from "./profileutils.js";

export function tabProfileForFlameGraph(extensionId) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    let activeTab = tabs[0];
    console.log("Active Tab ID: " + activeTab.id);
    const tabId = activeTab.id;
    chrome.debugger.attach({ tabId: tabId }, "1.3", async function () {
      if (chrome.runtime.lastError) {
        console.log("Error: " + chrome.runtime.lastError.message);
        return;
      }
      console.log("Debugger attached");
      setAttached({ tabId: tabId });

      chrome.debugger.sendCommand({ tabId: tabId }, "Profiler.enable", () => {
        console.log("Profiler enabled");
      });

      chrome.debugger.sendCommand({ tabId: tabId }, "Profiler.start", () => {
        console.log("Profiler started");
      });

      await waitForStopButtonClick();

      chrome.debugger.sendCommand(
        { tabId: tabId },
        "Profiler.stop",
        async (result) => {
            console.log("Profiler stopped");
            const profile = result.profile;
            console.log(JSON.stringify(profile, null, 2));
            extensionId = await getId();
            console.log("extensionID", extensionId)
            const transformedData = transformProfileData(profile, extensionId);
            console.log("Before saving", transformedData);
            const jsonData = JSON.stringify(transformedData, null, 2);

            // Save the stringified JSON using chrome.storage.local
            chrome.storage.local.set({myJsonData: jsonData}, function () {
                console.log("JSON data has been saved.");
                chrome.runtime.sendMessage({action: "dataSaved"});
            });
        },
      );
    });
  });
}
