
function waitForNonExistentEvent() {
  console.log("Setting up event listener for nonExistentEvent");
  document.addEventListener("nonExistentEvent", function () {
    console.log("This event handler will never be triggered");
  });
  console.log("Event listener for nonExistentEvent has been set up");
}

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

function executeFunction() {
  console.log("This function is called: executeFunction");
}

chrome.runtime.sendMessage(
  { action: "doSomething", data: "someData" },
  function (response) {
    console.log("Response from background:", response);
  },
);


function content_script_bottleneck() {
  console.log("starting 5s loop in content script");
  // await new Promise(r => setTimeout(r, 50000));
  // let i = 0;
  // while (9 < 10) {
  //   i = 1;
  // }
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

content_script_bottleneck();

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.action === "iconClicked") {
//     console.log("Extension icon clicked - recognized in content script");
//     // call only one function
//     executeFunction();
//     executeFunction();
//     executeFunction();

//     content_script_bottleneck();

//     // Uncomment for more nuanced testing
//     // waitForNonExistentEvent();

//     // Uncomment if we need to look at block coverage
//     // conditionalLogic();
//   }
// });

