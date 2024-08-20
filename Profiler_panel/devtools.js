// Create a custom panel in DevTools
chrome.devtools.panels.create(
  'Performance',                   // Title of the panel
  'icons/icon.png',               // Icon for the panel
  'panel.html',                   // HTML file for the panel's content
  function(panel) {
    // Callback function when the panel is created
    console.log('Custom DevTools panel created');

    // Optional: You can set up additional functionality here
    panel.onShown.addListener(function(window) {
      console.log('Panel shown');
    });

    panel.onHidden.addListener(function() {
      console.log('Panel hidden');
    });
  }
);
