import { checkValidUrl } from "./helpers.js";

export function transformProfileData(profile, extensionId) {
  if (!profile || !profile.nodes || !profile.nodes.length) {
    console.error("Invalid profile data");
    return null;
  }

  const nodes = profile.nodes;
  const root = nodes[0];
  const samples = [root.id].concat(profile.samples || []);
  const deltas = [0].concat(profile.timeDeltas || []);
  const timeValues = new Map();

  samples.forEach((sample, index) => {
    const id = samples[index - 1];
    const curr = timeValues.get(id) || 0;
    const delta = deltas[index];
    timeValues.set(id, curr + delta);
  });
  let totalTime = deltas.reduce((sum, time) => sum + time, 0);

  const childrenMap = new Map();
  const idMap = new Map();

  nodes.forEach((node, index) => {
    if (node.children) {
      childrenMap.set(node.id, node.children);
    }
    idMap.set(node.id, index);
  });

  function processNode(nodeId) {
    const idx = idMap.get(nodeId);
    const node = nodes[idx];

    if (!node) return null;

    let label =
      node.callFrame.functionName && node.callFrame.functionName.trim() !== ""
        ? node.callFrame.functionName
        : `(${node.callFrame.url})`;

    if (checkValidUrl(`${node.callFrame.url}`, extensionId)) {
      label = "Run by extension: " + label;
    }
    const result = {
      name: label,
      value: node.hitCount || 1,
      children: [],
    };

    const children = childrenMap.get(nodeId) || [];
    children.forEach((childId) => {
      const childNode = processNode(childId);
      if (childNode) {
        result.children.push(childNode);
        result.value += childNode.value;
      }
    });

    return result;
  }

  return processNode(nodes[0].id);
}
