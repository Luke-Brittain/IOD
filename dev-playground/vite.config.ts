import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

export default defineConfig({
  plugins: [
    react(),
    // simple mock API middleware for dev-playground
    {
      name: 'dev-mock-api',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          try {
            const url = req.url || '';
            const nodeMatch = url.match(/^\/api\/nodes\/([^\/?#]+)(?:[\/?#].*)?$/);
            const neighMatch = url.match(/^\/api\/nodes\/([^\/]+)\/neighbors(?:\?.*)?$/);
            const file = path.resolve(__dirname, 'src', 'data', 'sampleGraph.json');
            const body = fs.readFileSync(file, 'utf8');
            const data = JSON.parse(body);
            if (neighMatch) {
              const id = decodeURIComponent(neighMatch[1]);
              // parse optional ?depth=N (default 1)
              let maxDepth = 1;
              try {
                const parsedUrl = new URL(req.url || '', 'http://localhost');
                const d = parsedUrl.searchParams.get('depth');
                const n = d ? parseInt(d, 10) : NaN;
                if (!Number.isNaN(n) && n >= 1) maxDepth = n;
              } catch (e) {
                // keep default
              }

              const nodes = data.nodes || [];
              const edges = data.edges || [];

              // build adjacency map from node id -> list of edges
              const adjacency = new Map<string, any[]>();
              edges.forEach((e: any) => {
                adjacency.set(e.source, (adjacency.get(e.source) || []).concat(e));
                adjacency.set(e.target, (adjacency.get(e.target) || []).concat(e));
              });

              const visited = new Set<string>();
              const results: Array<any> = [];

              // BFS frontier starting at the requested node id
              let frontier: string[] = [id];
              visited.add(id);

              for (let depth = 1; depth <= maxDepth; depth++) {
                const nextFrontier: string[] = [];
                for (const curId of frontier) {
                  const relEdges = adjacency.get(curId) || [];
                  for (const e of relEdges) {
                    const neighborId = e.source === curId ? e.target : e.source;
                    if (visited.has(neighborId)) continue;
                    visited.add(neighborId);
                    nextFrontier.push(neighborId);
                    const node = nodes.find((n: any) => n.id === neighborId) || null;
                    results.push({ node, edge: e, depth });
                  }
                }
                if (nextFrontier.length === 0) break;
                frontier = nextFrontier;
              }

              const payload = { success: true, data: { id, depth: maxDepth, neighbors: results } };
              res.setHeader('Content-Type', 'application/json');
              res.writeHead(200);
              res.end(JSON.stringify(payload));
              return;
            }
            if (nodeMatch) {
              const id = decodeURIComponent(nodeMatch[1]);
              const node = (data.nodes || []).find((n: any) => n.id === id) || null;
              const payload = { success: true, data: node };
              res.setHeader('Content-Type', 'application/json');
              res.writeHead(200);
              res.end(JSON.stringify(payload));
              return;
            }
          } catch (err) {
            // fallthrough to next
          }
          next();
        });
      }
    }
  ],
  resolve: {
    alias: {
      '@local/design-system': path.resolve(__dirname, '..', 'design-system', 'src'),
      '@': path.resolve(__dirname, '../OliveBranch')
    }
  },
  server: {
    port: 5174
  }
});
