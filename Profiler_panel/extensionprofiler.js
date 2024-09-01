import { getId, setAttached, waitForStopButtonClick } from "./helpers.js";
import { transformProfileData } from "./profileutils.js";

export function extensionProfileForFlameGraph(extensionId) {
  // sendToDevTools("Extension ID in DevTools panel!");
  console.log("extensionID", extensionId);
  chrome.debugger.getTargets((result) => {
    // sendToDevTools(result);
    let target = result.find((t) => t.title.includes(extensionId));
    if (target) {
      const targetId = target.id;
      chrome.debugger.attach({ targetId: targetId }, "1.3", async function () {
        if (chrome.runtime.lastError) {
          console.log("Error: " + chrome.runtime.lastError.message);
          return;
        }
        console.log("Debugger attached");
        setAttached({ targetId: targetId });
        // Enable the debugger and profiler
        chrome.debugger.sendCommand(
          { targetId: targetId },
          "Debugger.enable",
          () => {
            console.log("Debugger enabled");
          },
        );

        chrome.debugger.sendCommand(
          { targetId: targetId },
          "Profiler.enable",
          () => {
            console.log("Profiler enabled");
          },
        );

        chrome.debugger.sendCommand(
          { targetId: targetId },
          "Profiler.start",
          () => {
            console.log("Profiler started");
          },
        );

        await waitForStopButtonClick();

        chrome.debugger.sendCommand(
          { targetId: targetId },
          "Profiler.stop",
          (result) => {
            console.log("RESULT IS", result);
            const profile = result.profile;
            console.log("PROFILERRR:", profile);
            console.log(JSON.stringify(profile, null, 2));
            const transformedData = transformProfileData(profile);
            console.log("BEFORRRRRRRRRRRE", profile);

            // Serialize JSON object to a string
            const jsonData = JSON.stringify(transformedData, null, 2);
            console.log(jsonData);
            // Save the stringified JSON using chrome.storage.local
            chrome.storage.local.set({ myJsonData: jsonData }, function () {
              console.log("JSON data has been saved.");
              chrome.runtime.sendMessage({ action: "dataSaved" });
            });
          },
        );
      });
    } else {
      sendToDevTools("Target not found.");
    }
  });
}
