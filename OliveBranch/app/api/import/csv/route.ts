import importCsvHandler from '../../../../generated/importCsvStub';

export async function POST(request: Request) {
  return importCsvHandler(request);
}
