import { transformProfileData } from "./profileUtils.js";
export function extensionProfileForFlameGraph() {
  const extensionId = "gighmmpiobklfepjocnamgkkbiglidom";
  chrome.debugger.getTargets((result) => {
    let target = result.find((t) => t.title.includes(extensionId));
    if (target) {
      const targetId = target.id;
      chrome.debugger.attach({ targetId: targetId }, "1.3", async function () {
        if (chrome.runtime.lastError) {
          console.log("Error: " + chrome.runtime.lastError.message);
          return;
        }
        console.log("Debugger attached");
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
        await new Promise((r) => setTimeout(r, 5000));
        chrome.debugger.sendCommand(
          { targetId: targetId },
          "Profiler.stop",
          (result) => {
            const profile = result.profile;
            const transformedData = transformProfileData(profile);
            const jsonData = JSON.stringify(transformedData, null, 2);
            chrome.storage.local.set({ myJsonData: jsonData }, function () {
              chrome.runtime.sendMessage({ action: "dataSaved" });
            });
          },
        );
      });
    } else {
      console.log("Target not found.");
    }
  });
}
