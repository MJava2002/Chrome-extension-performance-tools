console.log('requests.js loaded');

console.log("Before defining URLs");
// Define an array of URLs you want to request
const urls = [
  'https://jsonplaceholder.typicode.com/posts/1',
  'https://jsonplaceholder.typicode.com/posts/2',
  'https://jsonplaceholder.typicode.com/posts/3'
]

console.log("Before defining sendWebRequests function");
// Function to send web requests
function sendWebRequests() {
  urls.forEach(url => {
      fetch(url)
          .then(response => response.json())  // Parse the JSON response
          .then(data => {
              console.log(`Content script; Data from ${url}:`, data);
          })
          .catch(error => {
              console.error(`Content script; Error fetching ${url}:`, error);
          });
  });
}

console.log("Before adding listener");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (chrome.runtime.lastError) {
      console.error("Error while setting up onMessage listener:", chrome.runtime.lastError);
      return;  // Exit early if there's an error
    }
    if (message.action === "iconClicked") {
      console.log("Extension icon clicked - recognized in content script");
      sendWebRequests();
    }
});

console.log('before sending message');
chrome.runtime.sendMessage(
  { action: "doSomething", data: "someData" },
  function (response) {
    if (chrome.runtime.lastError) {
      console.error("Error in sending message:", chrome.runtime.lastError);
      return;  // Exit early if there's an error
  }
    console.log("Response from background:", response);
  }
);