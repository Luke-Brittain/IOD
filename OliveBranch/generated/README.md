# Generated API client & stubs

Files under this folder are small, hand-maintainable stubs generated from the OpenAPI used in the project. They are intended as a starting point and should be adapted to your needs.

- `apiClient.ts`: a minimal fetch-based TypeScript client for the `/api/import/csv` endpoint. Use `importCsvAsJson` for JSON rows and `importCsvFile` for file uploads from the browser.
- `importCsvStub.ts`: a server-side stub (Next.js-style `Request -> Response`) demonstrating how to accept application/json rows. Replace the multipart handling with your preferred parser and implement validation and persistence.

Usage examples

Client (browser):
```ts
import api from '@/OliveBranch/generated/apiClient';

const rows = [ { external_id: 'id-1', name: 'Alice' } ];
const res = await api.importCsvAsJson(rows, { dryRun: true });
console.log(res.results);
```

Server (Next.js app route):
```ts
import importCsvHandler from '@/OliveBranch/generated/importCsvStub';

export async function POST(request: Request) {
  return importCsvHandler(request);
}
```

Notes
- The generated client expects the import route to return `{ results: RowResult[] }`.
- For multipart uploads in server code, implement streaming parsing (e.g., `csv-parse`) and large-file safeguards.
