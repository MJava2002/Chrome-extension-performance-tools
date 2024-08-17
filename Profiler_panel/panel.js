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
const extensionId = "gpjandipboemefakdpakjglanfkfcjei"; // Extension ID
let panelWindowId;
document.addEventListener('DOMContentLoaded', () => {
  const dropdownContent = document.querySelector('.dropdown-content');
  const runExtension = document.getElementById('runExtension');
  const runTab = document.getElementById('runTab');

  // Show dropdown content when clicking the dropdown button
  document.querySelector('.dropdown-button').addEventListener('click', (event) => {
    event.stopPropagation(); // Prevent clicks from propagating to the document
    const isVisible = dropdownContent.style.display === 'block';
    dropdownContent.style.display = isVisible ? 'none' : 'block';
  });

  // Log which option was clicked
  runExtension.addEventListener('click', (event) => {
    event.preventDefault(); // Prevent default link behavior
    console.log('Extension clicked');
    dropdownContent.style.display = 'none'; // Hide the dropdown
  });

  runTab.addEventListener('click', (event) => {
    event.preventDefault(); // Prevent default link behavior
    console.log('Tab clicked');
    dropdownContent.style.display = 'none'; // Hide the dropdown
  });

  // Close the dropdown if the user clicks outside of it
  document.addEventListener('click', () => {
    dropdownContent.style.display = 'none';
  });
});



document.getElementById("coverageButton").addEventListener("click", function() {
  chrome.runtime.sendMessage({action: "buttonClicked"});
});
// Function to update display

// Listen for messages from the background script
// panel.js

// Function to update the display of background messages
function updateDisplay(containerId, message) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerText = message;
  }
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target === 'devtools') {
    updateDisplay('backgroundMessages', (document.getElementById('backgroundMessages')?.innerText || '') + message.message + '\n');
  }
});

// Create a container for background messages
const messagesContainer = document.createElement('div');
messagesContainer.id = 'backgroundMessages';
messagesContainer.style.cssText = `
  position: relative;
  left: 10px;
  font-size: 14px;
  color: white;
  font-family: monospace;
  white-space: pre-wrap;
  margin-top: 20px;
`;
document.body.appendChild(messagesContainer);


let startTime, endTime;

document.getElementById('recordButton').addEventListener('click', function () {
  startTime = new Date();
  document.getElementById('timeDisplay').innerText = ''; // Clear previous time display
  console.log('Recording started at', startTime);
});

document.getElementById('stopButton').addEventListener('click', function () {
  if (startTime) {
    endTime = new Date();
    const timeElapsed = ((endTime - startTime) / 1000).toFixed(2); // Time in seconds
    document.getElementById('timeDisplay').innerText = `Time: ${timeElapsed} seconds`;
    console.log('Recording stopped at', endTime, 'Elapsed time:', timeElapsed, 'seconds');
  } else {
    console.log('Recording not started.');
  }
});
// const output = document.getElementById('output');
// const tabId = chrome.devtools.inspectedWindow.tabId;
// output.textContent = `Tab ID: ${tabId}`;

//
// const extensionId = "mmgodofmgemfldcejapbjjcbphiajiaj";
// let tabId;
//
// // Function to create the button
// function createButton() {
//   const button = document.createElement('button');
//   button.id = 'coverageButton';
//   button.innerHTML = '&#8634;'; // Refresh symbol
//   button.style.cssText = `
//     position: relative;
//     left: 10px;
//     top: 10px;
//     width: 28px;
//     height: 28px;
//     border-radius: 2px;
//     background-color: #3c3c3c;
//     border: none;
//     color: #e0e0e0;
//     font-size: 18px;
//     cursor: pointer;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     margin-bottom: 10px;
//   `;
//   document.body.appendChild(button);
//   return button;
// }
//
// // Function to display resource types
// function displayResourceTypes() {
//   const types = {};
//   chrome.devtools.inspectedWindow.getResources((resources) => {
//     resources.forEach((resource) => {
//       if (!(resource.type in types)) {
//         types[resource.type] = 0;
//       }
//       types[resource.type] += 1;
//     });
//     let result = `Resources:\n${Object.entries(types)
//       .map((entry) => {
//         const [type, count] = entry;
//         return `${type}: ${count}`;
//       })
//       .join('\n')}`;
//
//     updateDisplay('resourceTypes', result);
//   });
// }
//
// // Function to run code coverage analysis
// async function runCodeCoverage() {
//   chrome.devtools.inspectedWindow.getResources((resources) => {
//     let totalBytes = 0;
//     let usedBytes = 0;
//
//     const coveragePromises = resources
//       .filter(resource => resource.type === 'script')
//       .map(resource => {
//         return new Promise((resolve) => {
//           resource.getContent((content) => {
//             totalBytes += content.length;
//             chrome.devtools.inspectedWindow.eval(
//               `
//               (async () => {
//                 const coverage = await chrome.devtools.inspectedWindow.profiler.takePreciseCoverage();
//                 const scriptCoverage = coverage.find(c => c.url === "${resource.url}");
//                 if (scriptCoverage) {
//                   return scriptCoverage.functions.reduce((sum, func) =>
//                     sum + func.ranges.reduce((s, range) => s + range.endOffset - range.startOffset, 0), 0);
//                 }
//                 return 0;
//               })()
//               `,
//               (result, isException) => {
//                 if (!isException) {
//                   usedBytes += result;
//                 }
//                 resolve();
//               }
//             );
//           });
//         });
//       });
//
//     Promise.all(coveragePromises).then(() => {
//       const coveragePercentage = (usedBytes / totalBytes) * 100;
//       updateDisplay('coverageDisplay', `Code Coverage: ${coveragePercentage.toFixed(2)}%`);
//     });
//   });
// }
//
// // Function to run profiler
// async function runProfiler() {
//   if (!tabId) {
//     updateDisplay('profilerResult', 'Error: No active tab');
//     return;
//   }
//
//   try {
//     await chrome.debugger.attach({tabId: tabId}, '1.3');
//     console.log('Debugger attached');
//
//     await chrome.debugger.sendCommand({tabId: tabId}, 'Debugger.enable');
//     console.log('Debugger enabled');
//
//     await chrome.debugger.sendCommand({tabId: tabId}, 'Profiler.enable');
//     console.log('Profiler enabled');
//
//     await chrome.debugger.sendCommand({tabId: tabId}, 'Profiler.start');
//     console.log('Profiler started');
//
//     await new Promise(r => setTimeout(r, 2000));
//
//     const result = await chrome.debugger.sendCommand({tabId: tabId}, 'Profiler.stop');
//     console.log('Profiler stopped');
//     console.log(result.profile);
//
//     updateDisplay('profilerResult', `Profiler Result: ${JSON.stringify(result.profile, null, 2)}`);
//
//     await chrome.debugger.detach({tabId: tabId});
//   } catch (error) {
//     console.error('Error in profiler:', error);
//     updateDisplay('profilerResult', `Error: ${error.message}`);
//   }
// }
//
// // Function to update display
// function updateDisplay(id, content) {
//   const element = document.getElementById(id);
//   if (element) {
//     element.innerText = content;
//   } else {
//     const newElement = document.createElement('div');
//     newElement.id = id;
//     newElement.style.cssText = `
//       position: relative;
//       left: 10px;
//       font-size: 14px;
//       color: #e0e0e0;
//       font-family: monospace;
//       white-space: pre-wrap;
//       margin-bottom: 10px;
//     `;
//     if (id === 'coverageDisplay') {
//       newElement.style.color = 'white';
//     }
//     newElement.innerText = content;
//     document.body.appendChild(newElement);
//   }
// }
//
// // Create and add the button to the panel
// const coverageButton = createButton();
//
// // Initial display
// displayResourceTypes();
// runCodeCoverage();
// runProfiler();
//
// // Add click event listener to the button to refresh all data
// coverageButton.addEventListener('click', () => {
//   displayResourceTypes();
//   runCodeCoverage();
//   runProfiler();
// });
//
// // Listen for tab updates to get the current tab ID
// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   if (changeInfo.status === 'complete' && tab.active) {
//     chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
//       if (tabs[0]) {
//         tabId = tabs[0].id;
//       }
//     });
//   }
// });