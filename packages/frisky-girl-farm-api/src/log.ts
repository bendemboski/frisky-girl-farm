export default function log(...args: unknown[]) {
  if (!process.env.NO_LOGGING) {
    console.log(...args);
  }
}
