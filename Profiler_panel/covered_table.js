function createProgressBar(containerId, widthPercentage) {
  const widthPercent = `${widthPercentage}%`;
  console.log(widthPercent);
  var bar = new ProgressBar.Line(containerId, {
    strokeWidth: 4,
    easing: "easeInOut",
    duration: 1400,
    color: "#FFEA82",
    trailColor: "#eee",
    trailWidth: 1,
    svgStyle: { width: widthPercent, height: "12px" },
    text: {
      style: {
        color: "#999",
        position: "absolute",
        right: "0",
        top: "50%", // Adjusted to align with the bar
        transform: "translateY(-50%)", // Center vertically with the bar
        padding: 0,
        margin: 0,
        transform: null,
      },
      autoStyleContainer: false,
    },
    from: { color: "#ED6A5A" },
    to: { color: "#AFE1AF" },
    step: (state, bar) => {
      bar.path.setAttribute("stroke", state.color);
      bar.setText(widthPercentage + " %");
    },
  });
  bar.set(0);
  bar.animate(1.0); // Animate from 0.0 to 1.0
}

export function drawTable(data) {
  // let i = 1
  // data.forEach((percentage, fileName) => {
  //   console.log('abcd')
  //   const container = document.getElementById('flameGraph');
  //   let bar = document.createElement("div");
  //   bar.id = `container${i}`;
  //   i += 1
  //   container.appendChild(bar);
  //   createProgressBar(`#${bar.id}`, percentage);
  // });
  const docBody = document.getElementById("flameGraph");
  docBody.innerHTML = "";
  const container = document.createElement("div");
  container.style.width = "100%";
  container.style.border = "1px solid black";

  // Create header row
  const headerRow = createCoverageTableRow(
    "header",
    "Filename",
    "Bytes Covered",
    "Coverage",
  );
  headerRow.style.fontWeight = "bold";
  container.appendChild(headerRow);

  // Add data rows
  data.forEach((item, index) => {
    const containerId = `container${index}`;
    const row = createCoverageTableRow(
      containerId,
      item.filename,
      item.bytesCovered,
      item.percentageCovered,
    );
    container.appendChild(row);

    docBody.appendChild(container);
    createProgressBar(`#${containerId}`, item.percentageCovered);
  });

  // Append the table to the body (or any other element you prefer)
  docBody.appendChild(container);
}

function createCoverageTableRow(
  containerId,
  filename,
  bytesCovered,
  coverageLabel,
) {
  const row = document.createElement("div");
  row.style.display = "flex";
  row.style.justifyContent = "space-between";
  row.style.borderBottom = "1px solid #ddd";
  row.style.padding = "8px 0";

  const filenameCell = document.createElement("div");
  filenameCell.textContent = filename;
  filenameCell.style.flex = "2";

  const bytesCoveredCell = document.createElement("div");
  bytesCoveredCell.textContent = bytesCovered;
  bytesCoveredCell.style.flex = "1";
  bytesCoveredCell.style.textAlign = "center";

  const coverageCell = document.createElement("div");
  coverageCell.style.flex = "3";
  coverageCell.style.textAlign = "left"; // Align the progress bar to the left

  if (containerId === "header") {
    coverageCell.textContent = coverageLabel;
    coverageCell.style.textAlign = "center"; // Center the text for the header
  } else {
    const progressBarContainer = document.createElement("div");
    progressBarContainer.style.position = "relative";
    progressBarContainer.style.width = "100%";
    progressBarContainer.style.height = "30px";
    progressBarContainer.style.marginLeft = "0"; // Align to the left
    progressBarContainer.id = containerId; // Assign the containerId to the progressBarContainer
    coverageCell.textContent = ""; // Clear the text content for data rows
    coverageCell.appendChild(progressBarContainer); // Append progress bar container for data rows
  }

  // Append the container to the coverageCell
  // coverageCell.appendChild(progressBarContainer);

  row.appendChild(filenameCell);
  row.appendChild(bytesCoveredCell);
  row.appendChild(coverageCell);

  // After appending the row, create the progress bar in the container
  // createProgressBar(`#${containerId}`, percentageCovered);

  return row;
}
