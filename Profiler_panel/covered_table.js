const TEXT_COLOR = "#baaec4";
const BORDER_COLOR = "#a79ab4";
const PINK = "#d6587e";
const YELLOW = "#eaa41e";
const ORANGE = "#f48250";
const IMAGE_PATH =
  "styles/Looking-Through-Telescope-2--Streamline-Bangalore (1).svg";

function interpolateColor(color1, color2, factor) {
  var result = color1
    .slice(1)
    .match(/.{2}/g)
    .map(function (value, index) {
      return Math.round(
        parseInt(value, 16) +
          factor *
            (parseInt(color2.slice(1).match(/.{2}/g)[index], 16) -
              parseInt(value, 16)),
      )
        .toString(16)
        .padStart(2, "0");
    });

  return "#" + result.join("");
}

function determineColors(num) {
  if (num >= 75) {
    return PINK;
  }
  if (num >= 50) {
    return ORANGE;
  }
  return YELLOW;
}

function createProgressBar(containerId, widthPercentage) {
  const widthPercent = `${widthPercentage}%`;
  const finalColor = determineColors(widthPercentage);
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
        color: TEXT_COLOR,
        position: "absolute",
        right: "0",
        top: "50%", // Adjusted to align with the bar
        transform: "translateY(-50%)", // Center vertically with the bar
        padding: 0,
        margin: 0,
      },
      autoStyleContainer: false,
    },
    from: { color: YELLOW },
    to: { color: finalColor },
    step: (state, bar) => {
      const progress = bar.value();

      let color = state.color;
      if (progress < 0.5 && widthPercentage >= 50) {
        color = interpolateColor(YELLOW, ORANGE, progress * 2);
      } else if (widthPercentage >= 50) {
        color = interpolateColor(ORANGE, finalColor, (progress - 0.5) * 2);
      }

      bar.path.setAttribute("stroke", color);
      bar.setText(widthPercentage + " %");
    },
  });
  bar.set(0);
  bar.animate(1.0); // Animate from 0.0 to 1.0
}

export function addImage(IMAGE_PATH, message) {
  const docBody = document.getElementById("flameGraph");
  const container = document.createElement("div");
  container.style.width = "100%";
  container.style.border = "1px solid " + BORDER_COLOR;
  container.style.border = "none";
  const emptyRow = document.createElement("div");
  emptyRow.style.textAlign = "center";

  const img = document.createElement("img");
  img.src = IMAGE_PATH;
  img.alt = message;
  img.style.width = "20%";
  const text = document.createElement("div");
  text.textContent = message;
  text.style.fontFamily = "'MyCustomFont', sans-serif";
  text.style.color = TEXT_COLOR;
  text.style.marginTop = "10px";
  text.style.fontSize = "24px";

  emptyRow.appendChild(img);
  emptyRow.appendChild(text);

  container.appendChild(emptyRow);
  docBody.appendChild(container);
}

export function drawTable(data) {
  const docBody = document.getElementById("flameGraph");
  docBody.innerHTML = "";
  if (data.size === 0) {
    const message = "Nothing to observe here";
    addImage(IMAGE_PATH, message)
   
  } else {

  const container = document.createElement("div");
  container.style.width = "100%";
  container.style.border = "1px solid " + BORDER_COLOR;
    const headerRow = createCoverageTableRow(
      "header",
      "File Name",
      "Bytes Covered",
      "Coverage",
    );
    headerRow.style.fontWeight = "bold";
    container.appendChild(headerRow);

    data.forEach((item, index) => {
      const containerId = `container${index}`;
      const row = createCoverageTableRow(
        containerId,
        item.fileName,
        item.bytesCovered,
        item.percentageCovered,
      );
      // Add a click event listener to open a modal
      row.addEventListener("click", () => {
        openModal(item); // Function to open the modal with item details
      });

      container.appendChild(row);

      docBody.appendChild(container);
      createProgressBar(`#${containerId}`, item.percentageCovered);
    });
    docBody.appendChild(container);
  }

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
  row.style.borderBottom = "1px solid " + BORDER_COLOR;
  row.style.padding = "8px 0";

  const filenameCell = document.createElement("div");
  filenameCell.textContent = filename;
  filenameCell.style.flex = "2";
  filenameCell.style.color = TEXT_COLOR;

  const bytesCoveredCell = document.createElement("div");
  bytesCoveredCell.textContent = bytesCovered;
  bytesCoveredCell.style.flex = "1";
  bytesCoveredCell.style.textAlign = "center";
  bytesCoveredCell.style.color = TEXT_COLOR;

  const coverageCell = document.createElement("div");
  coverageCell.style.flex = "3";
  coverageCell.style.textAlign = "left"; // Align the progress bar to the left

  if (containerId === "header") {
    coverageCell.textContent = coverageLabel;
    coverageCell.style.color = TEXT_COLOR;
    coverageCell.style.textAlign = "center"; // Center the text for the header
  } else {
    const progressBarContainer = document.createElement("div");
    progressBarContainer.style.position = "relative";
    progressBarContainer.style.width = "100%";
    progressBarContainer.style.height = "30px";
    progressBarContainer.style.marginLeft = "0"; // Align to the left
    progressBarContainer.id = containerId; // Assign the containerId to the progressBarContainer
    coverageCell.textContent = ""; // Clear the text content for data rows
    coverageCell.appendChild(progressBarContainer);
  }

  row.appendChild(filenameCell);
  row.appendChild(bytesCoveredCell);
  row.appendChild(coverageCell);

  return row;
}
function openModal(item) {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  overlay.style.zIndex = "999";

  const modal = document.createElement("div");
  modal.style.position = "fixed";
  modal.style.width = "500px";
  modal.style.height = "400px";
  modal.style.top = "50%";
  modal.style.left = "50%";
  modal.style.transform = "translate(-50%, -50%)";
  modal.style.backgroundColor = "#fff";
  modal.style.padding = "20px";
  modal.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.5)";
  modal.style.zIndex = "1000"; // Ensure the modal is above the overlay
  modal.style.overflowY = "auto"; // Add vertical scroll if content overflows
  modal.style.border = "4px solid"

  const highlightedContent = highlightRanges(item.content, item.ranges);

  const modalContent = `
    <h2>${item.fileName}</h2>
    <p>Coverage: ${item.percentageCovered}%</p>
    <pre style="white-space: pre-wrap;">${highlightedContent}</pre>
  `;
  modal.innerHTML = modalContent;

  document.body.appendChild(overlay);
  document.body.appendChild(modal);

  overlay.addEventListener("click", () => {
    document.body.removeChild(modal);
    document.body.removeChild(overlay);
  });
}

function highlightRanges(content, ranges) {
  let result = "";
  let currentIndex = 0;

  ranges.sort((a, b) => a[0] - b[0]);

  ranges.forEach(([start, end]) => {
    result += escapeHtml(content.slice(currentIndex, start));
    result += `<span style="background-color: yellow;">${escapeHtml(content.slice(start, end))}</span>`;
    currentIndex = end;
  });

  result += escapeHtml(content.slice(currentIndex));

  return result;
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, function (m) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[m];
  });
}
