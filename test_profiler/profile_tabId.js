/* Collect the profile of an entire tab, 
* filter extension related events from the result
*/

var tabId;
const extensionId = 'gighmmpiobklfepjocnamgkkbiglidom';

chrome.action.onClicked.addListener(function (tab) {
    console.log('CLICKED');
    console.log(tab.url);
    if (tab.url.startsWith('http')) {
        tabId = tab.id;
        chrome.debugger.attach({ tabId: tabId }, '1.3', async function () {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
                return;
            }
            console.log('Debugger attached');
        
            // Enable debugger
            chrome.debugger.sendCommand({ tabId: tabId }, 'Profiler.enable', () => {
                console.log('Profiler enabled');
            });

            chrome.debugger.sendCommand({ tabId: tabId }, 'Profiler.start', () => {
                console.log('Profiler started');
            });

            //sleep
            await new Promise(r => setTimeout(r, 3000));

            chrome.debugger.sendCommand({ tabId: tabId }, 'Profiler.stop', (result) => {
                console.log('Profiler stopped');
                const profile = result.profile;
                console.log(profile.nodes);
                const nodes = profile.nodes.filter(isExtensionNode);
                console.log(nodes);
            });

        });
    }
});

function isExtensionNode(node) {
    return node.callFrame.url.includes(extensionId);
}