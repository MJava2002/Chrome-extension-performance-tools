console.log('requests.js loaded');

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
                console.log(`Content script; Data from ${url}:`, data);
            })
            .catch(error => {
                console.error(`Content script; Error fetching ${url}:`, error);
            });
    });
  }

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "iconClicked") {
      console.log("Extension icon clicked - recognized in content script");
      sendWebRequests();
    }
  });