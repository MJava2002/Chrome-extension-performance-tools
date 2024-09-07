console.log("Background");

console.log("Before adding listener");

/*
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // Wait for this message to ensure that content script started executing
  console.log("Message received in background:", request);

  if (request.action === "doSomething") {
    // Perform some action
    const result = "processedData";

    chrome.action.onClicked.addListener((tab) => {
      if (chrome.runtime.lastError) {
        console.error(
          "Error while setting up onMessage listener:",
          chrome.runtime.lastError,
        );
        return; // Exit early if there's an error
      }
      chrome.tabs.sendMessage(tab.id, { action: "iconClicked" });
      if (chrome.runtime.lastError) {
        console.error(
          "Error while sending message:",
          chrome.runtime.lastError,
        );
        return;
      }
      // sendWebRequests();
      // bottleneck();
    });
    sendResponse({ result: "Nope" });
  }

  Return true to indicate you want to send a response asynchronously
  return true;
});
*/

chrome.action.onClicked.addListener((tab) => {
  if (chrome.runtime.lastError) {
    console.error(
      "Error while setting up onMessage listener:",
      chrome.runtime.lastError,
    );
    return;
  }
  sendManyWebRequests(); 
  requestLargeResource();
  bottleneck();
});

const urls = [
  "https://jsonplaceholder.typicode.com/posts/1",
  "https://jsonplaceholder.typicode.com/posts/2",
  "https://jsonplaceholder.typicode.com/posts/3",
  "https://jsonplaceholder.typicode.com/posts/4",
  "https://jsonplaceholder.typicode.com/posts/5",
  "https://jsonplaceholder.typicode.com/posts/6",
  "https://jsonplaceholder.typicode.com/posts/7",
];

function sendManyWebRequests() {
  urls.forEach((url) => {
    fetch(url)
      .then((response) => response.json()) // Parse the JSON response
      .then((data) => {
        console.log(`Data from ${url}:`, data);
      })
      .catch((error) => {
        console.error(`Error fetching ${url}:`, error);
      });
  });
}

function requestLargeResource() {
  const url = 'https://www.gutenberg.org/cache/epub/10/pg10.txt';
  fetch(url)
      .then(() => {
        console.log(`Received large data from ${url}`);
      })
      .catch((error) => {
        console.error(`Error fetching ${url}:`, error);
      });
}

function bottleneck() {
  console.log("starting 5s loop in bg");

  const msToRun = 5000 // 5 seconds

  const t0 = performance.now() // or Date.now()

  let iterations = 0

  setTimeout(() => {
    console.log(`This won't be logged until the loop is over.`)
  }, 0)

  while ((performance.now() - t0) < msToRun) {
      ++iterations
  }

  console.log(`Loop run for ${ iterations } iterations.`)
}