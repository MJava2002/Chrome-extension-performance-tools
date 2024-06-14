const extensionId = "kkkbiiikppgjdiebcabomlbidfodipjg";
var tabId;

chrome.action.onClicked.addListener(function (tab) {
    if (tab.url.startsWith('http')) {
        tabId = tab.id;
        
        chrome.debugger.attach({ extensionId: extensionId}, '1.3', async function () {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
                return;
            }
            console.log('Debugger attached');
        
            // Enable debugger
            chrome.debugger.sendCommand({ extensionId: extensionId}, 'Debugger.enable', () => {
                console.log('Debugger enabled');
            });

            chrome.debugger.sendCommand({ extensionId: extensionId }, 'Profiler.enable', () => {
                console.log('Profiler enabled');
            });

            chrome.debugger.sendCommand({ extensionId: extensionId }, 'Profiler.start', () => {
                console.log('Profiler started');
            });

            //sleep
            await new Promise(r => setTimeout(r, 2000));

            chrome.debugger.sendCommand({ extensionId: extensionId }, 'Profiler.stop', (result) => {
                console.log('Profiler stopped');
                console.log(result.profile);
            });
        });
    }
});