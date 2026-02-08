import importCsvHandler from '../../../../generated/importCsvHandlerClean';

export async function POST(request: Request) {
  return importCsvHandler(request);
}
