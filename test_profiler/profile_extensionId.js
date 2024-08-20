/*  Collect a profile of an extension's background worker
 *
 *   (!) Attaching to an extension background worker requires
 *   the extensions-on-chrome-urls flag to be set
 *   It works, but it shows a warning: "You are using an unsupported
 *   command-line flag. Stability and security will suffer"
 *
 *   Based on the docs, the silent-debugger-extension-api flag is
 *   requred, but it's unclear whether this is still supported
 */

const extensionId = "gighmmpiobklfepjocnamgkkbiglidom";

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

            //sleep
            await new Promise((r) => setTimeout(r, 2000));

            chrome.debugger.sendCommand(
              { targetId: targetId },
              "Profiler.stop",
              (result) => {
                console.log("Profiler stopped");
                console.log(result.profile);
              },
            );
          },
        );
      } else {
        console.log("No matching target found.");
      }
    });
  }
});
