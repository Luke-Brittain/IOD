#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function loadGraph() {
  const file = path.resolve(__dirname, '..', 'src', 'data', 'sampleGraph.json');
  const body = fs.readFileSync(file, 'utf8');
  return JSON.parse(body);
}

function getNeighbors(graph, startId, maxDepth = 1) {
  const nodes = graph.nodes || [];
  const edges = graph.edges || [];

  const adjacency = new Map();
  edges.forEach((e) => {
    adjacency.set(e.source, (adjacency.get(e.source) || []).concat(e));
    adjacency.set(e.target, (adjacency.get(e.target) || []).concat(e));
  });

  const visited = new Set();
  const results = [];

  let frontier = [startId];
  visited.add(startId);

  for (let depth = 1; depth <= maxDepth; depth++) {
    const nextFrontier = [];
    for (const curId of frontier) {
      const relEdges = adjacency.get(curId) || [];
      for (const e of relEdges) {
        const neighborId = e.source === curId ? e.target : e.source;
        if (visited.has(neighborId)) continue;
        visited.add(neighborId);
        nextFrontier.push(neighborId);
        const node = nodes.find((n) => n.id === neighborId) || null;
        results.push({ node, edge: e, depth });
      }
    }
    if (nextFrontier.length === 0) break;
    frontier = nextFrontier;
  }

  return results;
}

function main() {
  const graph = loadGraph();
  const firstNode = (graph.nodes && graph.nodes[0] && graph.nodes[0].id) || null;
  const startId = process.argv[2] || firstNode;
  const depth = process.argv[3] ? parseInt(process.argv[3], 10) : 2;
  if (!startId) {
    console.error('No start node found in graph and none provided.');
    process.exit(2);
  }

  const neighbors = getNeighbors(graph, startId, depth);
  const payload = { success: true, data: { id: startId, depth, neighbors } };
  console.log(JSON.stringify(payload, null, 2));
}

main();