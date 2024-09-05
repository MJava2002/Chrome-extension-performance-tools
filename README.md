# TURBO -  Chrome Extension Performance Analysis Tool

## Prerequisites
### Node.js NPM
Make sure [Node and npm](https://nodejs.org/en/download/package-manager)  installed on your system.

### d3-flame-graph
Install the [d3-flame-graph](https://github.com/spiermar/d3-flame-graph) plugin.

```bash
$ npm install d3-flame-graph --save
```
## Acknowledgments

This project makes use of the following third-party libraries:

- **d3-flame-graph** (Licensed under the [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0))
## Description

Few extensions that were done as part of the research for the project

- Request Blocker
- Bookmarker
- [Color Shop](https://github.com/MJava2002/Extension/tree/612b3e989de595b57c4b3dbec37731ad7b28df45)

## Manual Installation:
- Clone the repository or download the ZIP file and extract it to your local machine.
```bash
git clone https://github.com/MJava2002/Chrome-extension-performance-tools.git
cd Profiler_panel
```
- Open Chrome and navigate to **chrome://extensions/**.
- Enable **Developer mode** by toggling the switch in the top right corner.
- Click **Load unpacked** and select the folder where you cloned or extracted the extension.
- The extension should now appear in your list of installed extensions.

## Running

### Select Extension:

Click on the Turbo icon in the Chrome toolbar.
In the popup, select extension to debug.

### Start Profiling:

- Open DevTools:

Right-click on the page you want to profile and select "Inspect" to open the DevTools panel.
Navigate to the Turbo tab within DevTools.

- Select Profiling Target:
Use the toggle to choose whether you want to debug the extension's service worker or content scripts.
- Select the desired tool:
Network, Coverage, or Flame Graph.

Click on the chosen profiling tool to start capturing data. 
This will begin capturing data from background and content scripts.

### Stop Profiling:

Press the Stop button in the panel when you are done. The extension will analyze the data and display the results.

### View Performance Analysis:
Inside the DevTools panel, you can see a flame graph, network activity, and other metrics to help you understand the performance of your scripts.


## Troubleshooting
### Common Issues:
- Make sure that you have granted the necessary permissions during installation.

### Reporting Bugs:
- If you encounter any issues, please report them on the [GitHub Issues](https://github.com/MJava2002/Extension/issues) page.
