let savedInp = [];
const inputEl = document.getElementById("input-el");
const saveBtn = document.getElementById("save-btn");
const tabBtn = document.getElementById("tab-btn");
const deleteBtn = document.getElementById("delete-btn");
const ulEl = document.getElementById("ul-el");

const prevPins = JSON.parse(localStorage.getItem("savedPins"));

if (prevPins) {
  savedInp = prevPins;
  displayList(savedInp);
}

deleteBtn.addEventListener("dblclick", function () {
  savedInp = [];
  localStorage.clear();
  displayList(savedInp);
});

saveBtn.addEventListener("click", function () {
  if (savedInp.includes(inputEl.value)) {
    inputEl.value = "";
    return;
  }

  savedInp.push(inputEl.value);
  localStorage.setItem("savedPins", JSON.stringify(savedInp));
  displayOne(inputEl.value);
  inputEl.value = "";
});

tabBtn.addEventListener("click", function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (savedInp.includes(tabs[0].url)) return;

    savedInp.push(tabs[0].url);
    localStorage.setItem("savedPins", JSON.stringify(savedInp));
    displayOne(tabs[0].url);
  });
});

function displayList(pins) {
  let listItems = "";
  pins.forEach((item) => {
    listItems += "<li><a href='#'>" + item + "</a></li>";
  });
  ulEl.innerHTML = listItems;
}

function displayOne(item) {
  let htmlItem = "<li><a target='_blank' href='#'>" + item + "</a></li>";
  ulEl.innerHTML += htmlItem;
}
