export function greet(name: string) {
  return `Hello, ${name}`;
}

if (require.main === module) {
  // simple runtime demo
  // eslint-disable-next-line no-console
  console.log(greet('Greenspaces'));
}
