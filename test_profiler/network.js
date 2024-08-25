const extensionId = "eillpajpafkjenplkofjfimdipclffpk";

chrome.action.onClicked.addListener(function (tab) {
  if (tab.url.startsWith("http")) {
    let target;

    chrome.debugger.getTargets((result) => {
      console.log(result);
      target = result.find((t) => t.title.includes(extensionId));

      if (target) {
        const targetId = target.id;
        console.log("Found target:", target);
        chrome.debugger.attach(
          { targetId: targetId },
          "1.3",
          async function () {
            if (chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError.message);
              return;
            }
            console.log("Debugger attached");

            // Enable debugger
            chrome.debugger.sendCommand(
              { targetId: targetId },
              "Debugger.enable",
              () => {
                console.log("Debugger enabled");
              },
            );

            chrome.debugger.sendCommand(
              { targetId: targetId },
              "Network.enable",
              () => {
                console.log("Network enabled");
              },
            );

            chrome.debugger.onEvent.addListener(function(debuggeeId, message, params) {
                if (message === "Network.requestWillBeSent") {
                console.log("Request intercepted: ", params.request);
                console.log(params);
                }
            });
          },
        );
      } else {
        console.log("No matching target found.");
      }
    });
  }
});
  
// Handle debugger detachment
chrome.debugger.onDetach.addListener(function(source, reason) {
    console.log("Debugger detached: ", reason);
});
  