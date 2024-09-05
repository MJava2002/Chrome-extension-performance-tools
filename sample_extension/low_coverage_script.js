/*
A script to test out the code coverage feature on, with a bunch of unused functions
In its current state, coverage should show around 200 bytes (length of lines 61-70)
*/

// Define a function that sets up an event listener for an event that will never happen
function waitForNonExistentEvent() {
  console.log("Setting up event listener for nonExistentEvent");
  document.addEventListener("nonExistentEvent", function () {
    console.log("This event handler will never be triggered");
  });
  console.log("Event listener for nonExistentEvent has been set up");
}

// Define a function that performs some conditional checks that will never be true
function conditionalLogic() {
  console.log("Entering conditionalLogic");
  if (2 * 2 !== 4) {
    console.log("This branch will never be executed");
  }

  const element = document.querySelector("#nonExistentElement");
  if (element) {
    console.log(
      "This condition will never be true because the element doesn't exist",
    );
  }
  console.log("Exiting conditionalLogic");
}

// Define a bunch of functions that won't be called
function unusedFunction1() {
  console.log("Entering unusedFunction1");
  console.log("This function is never called: unusedFunction1");
  console.log("This code should not show up as covered");
}

function unusedFunction2() {
  console.log("Entering unusedFunction2");
  console.log("This function is never called: unusedFunction2");
  console.log("This code should not show up as covered");
}

function unusedFunction3() {
  console.log("Entering unusedFunction3");
  console.log("This function is never called: unusedFunction3");
  console.log("This code should not show up as covered");
}

function unusedFunction4() {
  console.log("Entering unusedFunction4");
  console.log("This function is never called: unusedFunction4");
  console.log("This code should not show up as covered");
}

function unusedFunction5() {
  console.log("Entering unusedFunction5");
  console.log("This function is never called: unusedFunction5");
  console.log("This code should not show up as covered");
}

// A function that actually gets called
function executeFunction() {
  console.log("This function is called: executeFunction");
  let i = 0;
  while(true){
    i += 1;
    console.log(i)
  }
}

chrome.runtime.sendMessage(
  { action: "doSomething", data: "someData" },
  function (response) {
    console.log("Response from background:", response);
  },
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "iconClicked") {
    console.log("Extension icon clicked - recognized in content script");
    // call only one function
    executeFunction();

    // Uncomment for more nuanced testing
    // waitForNonExistentEvent();

    // Uncomment if we need to look at block coverage
    // conditionalLogic();
  }
});
