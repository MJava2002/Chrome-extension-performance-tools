import { checkValidUrl } from "./helpers.js";

export function transformProfileData(profile, extensionId) {
  if (!profile || !profile.nodes || !profile.nodes.length) {
    console.error("Invalid profile data");
    return null;
  }

  const nodes = profile.nodes;
  const sampleTimes = profile.timeDeltas || [];
  let totalTime = sampleTimes.reduce((sum, time) => sum + time, 0);

  // Create a map of node IDs to their children
  const childrenMap = new Map();
  const idMap = new Map();
  // Map from id to index

  nodes.forEach((node, index) => {
    if (node.children) {
      childrenMap.set(node.id, node.children); // Map id to children
    }
    idMap.set(node.id, index); // Map id to index
  });

  console.log(idMap);
  function processNode(nodeId) {
    const idx = idMap.get(nodeId);
    const node = nodes[idx];

    if (!node) return null;
    let label = node.callFrame.functionName;
    if (checkValidUrl(`(${node.callFrame.url})`, extensionId)) {
      label = "Run by extension: " + node.callFrame.functionName;
    }
    const result = {
      name: label || `(${node.callFrame.url}`,
      value: node.selfTime || 1,
      children: [],
    };

    const children = childrenMap.get(nodeId) || [];
    children.forEach((childId) => {
      const childNode = processNode(childId);
      if (childNode) {
        result.children.push(childNode);
        result.value += childNode.value; // Accumulate time from children
      }
    });

    return result;
  }

  // Start from the root node (usually the first node)
  const rootNode = processNode(nodes[0].id);

  // Normalize values to percentages of total time
  function normalizeValues(node) {
    node.value = (node.value / totalTime) * 100;
    node.children.forEach(normalizeValues);
  }
  normalizeValues(rootNode);

  return rootNode;
}
