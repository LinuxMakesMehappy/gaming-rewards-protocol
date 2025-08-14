// Global teardown for Jest
export default async function globalTeardown() {
  // Force exit after a short delay to ensure all async operations complete
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Force process exit to clean up any remaining handles
  process.exit(0);
}
