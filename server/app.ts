import { createApp } from './src';

// Make the main function async to properly await Apollo server initialization
async function startServer() {
  const app = await createApp();

  /* SERVER */
  const port = Number(process.env.PORT) || 3001;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
    console.log(`GraphQL endpoint: http://localhost:${port}/graphql`);
  });
}

// Start the server
startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
