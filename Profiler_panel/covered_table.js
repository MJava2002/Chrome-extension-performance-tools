var Line = require("progressbar.js")

function createProgressBar(containerId, widthPercentage) {
  const widthPercent = `${widthPercentage}%`;
  var bar = new Line(containerId, {
    strokeWidth: 4,
    easing: "easeInOut",
    duration: 1400,
    color: "#FFEA82",
    trailColor: "#eee",
    trailWidth: 1,
    svgStyle: { width: widthPercent, height: "100%" },
    text: {
      style: {
        color: "#999",
        position: "absolute",
        right: "0",
        top: "30px",
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

  bar.animate(1.0); // Animate from 0.0 to 1.0
}

export function drawTable(data) {
  data.array.forEach((fileName, percentage) => {
    let container = document.createElement("div");
    container.id = `container${i}`;
    document.body.appendChild(container);
    createProgressBar(`#${container.id}`, percentage);
  });
}
