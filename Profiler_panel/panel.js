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

let flameGraph;
document.addEventListener('DOMContentLoaded', function() {
    if (typeof d3 !== 'undefined' && typeof d3.flamegraph !== 'undefined') {
        initializeFlameGraph();
    } else {
        console.error('D3 or D3 Flame Graph library not loaded');
    }
});

function initializeFlameGraph() {
    flameGraph = d3.flamegraph()
        .width(960)
        .cellHeight(18)
        .transitionDuration(750)
        .minFrameSize(5)
        .title("")
        .label(function(d) { return d.name + " (" + d.value + ")"; });

    // Listen for flame graph data from the background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'flameGraphData') {
            renderFlameGraph(message.data);
        }
    });
}

function renderFlameGraph(data) {
    console.log('D3 version:', d3.version);
    console.log('D3 Flame Graph:', typeof d3.flamegraph);
    const chart = d3.select("#flameGraph");
    chart.datum(data).call(flameGraph);
}
document.getElementById("dropdown").addEventListener("click", function (event) {
  event.stopPropagation(); // Prevent clicks from propagating to the document
  this.classList.toggle('active');
});
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('dropdown-content');
    if (dropdown) {
        dropdown.classList.remove('active');
    }
});
document.getElementById('runExtension').addEventListener('click', function() {
    // Remove the active class to hide the dropdown
    const dropdown = document.getElementById('dropdown-content')
    if (dropdown) {
        dropdown.classList.remove('active');
    }
    // Send a message to background.js
    chrome.runtime.sendMessage({ action: 'runExtensionClicked' });
});

document.getElementById('runTab').addEventListener('click', function() {
    // Remove the active class to hide the dropdown
    const dropdown = document.getElementById('dropdown-content')
    if (dropdown) {
        dropdown.classList.remove('active');
    }
    // Send a message to background.js
    chrome.runtime.sendMessage({ action: 'runTabClicked' });
});


document.getElementById("coverageButton").addEventListener("click", function() {
  chrome.runtime.sendMessage({action: "buttonClicked"});
});

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