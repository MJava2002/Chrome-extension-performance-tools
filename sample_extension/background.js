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
