function createProgressBar(containerId, widthPercentage) {
  const widthPercent = `${widthPercentage}%`;
  console.log(widthPercent)
  var bar = new ProgressBar.Line(containerId, {
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
  let i = 1
  data.forEach((percentage, fileName) => {
    console.log('abcd')
    const container = document.getElementById('flameGraph');
    let bar = document.createElement("div");
    bar.id = `container${i}`;
    i += 1
    container.appendChild(bar);
    createProgressBar(`#${bar.id}`, percentage);
  });
}
