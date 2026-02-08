/**
 * lib/graph/client.ts
 * Simple Neo4j driver wrapper for server-side usage. Provides driver/session helpers.
 * If Neo4j is not used, replace with the selected graph DB client (Memgraph, etc.).
 */

import neo4j, { Driver, Session } from 'neo4j-driver';

let driverInstance: Driver | null = null;

export function getGraphDriver(): Driver {
  if (driverInstance) return driverInstance;

  const uri = process.env.GRAPH_DB_URL;
  const user = process.env.GRAPH_DB_USER;
  const password = process.env.GRAPH_DB_PASSWORD;

  if (!uri || !user || !password) {
    throw new Error('Graph DB credentials not found. Set GRAPH_DB_URL, GRAPH_DB_USER and GRAPH_DB_PASSWORD in environment.');
  }

  driverInstance = neo4j.driver(uri, neo4j.auth.basic(user, password));
  return driverInstance;
}

export function getSession(): Session {
  const driver = getGraphDriver();
  // default WRITE access; callers can override
  return driver.session({ defaultAccessMode: neo4j.session.WRITE });
}
