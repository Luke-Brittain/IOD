import importCsvHandler from '../../../../generated/importCsvStubClean';

export async function POST(request: Request) {
  return importCsvHandler(request);
}
