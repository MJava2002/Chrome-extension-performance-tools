// Create a new panel in the Chrome DevTools
chrome.devtools.panels.create(
  "Turbo",
  "icons/icon.png",
  "panel.html",
  function (panel) {
    panel.onShown.addListener(function (window) {
      console.log("Panel shown");
    });

    panel.onHidden.addListener(function () {
      console.log("Panel hidden");
    });
  },
);
