console.log("Background");

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // Wait for this message to ensure that content script started executing
  console.log("Message received in background:", request);

  if (request.action === "doSomething") {
    // Perform some action
    const result = "processedData";

    chrome.action.onClicked.addListener((tab) => {
      chrome.tabs.sendMessage(tab.id, { action: "iconClicked" });
    });
    // Send a response back to the content script
    sendResponse({ result: result });
  }

  // Return true to indicate you want to send a response asynchronously
  return true;
});

// Define an array of URLs you want to request
const urls = [
  'https://jsonplaceholder.typicode.com/posts/1',
  'https://jsonplaceholder.typicode.com/posts/2',
  'https://jsonplaceholder.typicode.com/posts/3'
];

// Function to send web requests
function sendWebRequests() {
  urls.forEach(url => {
      fetch(url)
          .then(response => response.json())  // Parse the JSON response
          .then(data => {
              console.log(`Data from ${url}:`, data);
          })
          .catch(error => {
              console.error(`Error fetching ${url}:`, error);
          });
  });
}

chrome.action.onClicked.addListener((tab) => {
  console.log('Sending requests')
  sendWebRequests();
});