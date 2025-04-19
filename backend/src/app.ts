import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import cors from 'cors';
import helmet from 'helmet';
import schema from './graphql/schema';
import logger from './utils/logger';

const app = express();

// Middleware
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// GraphQL server setup
const startApolloServer = async () => {
  const server = new ApolloServer({
    schema,
    context: ({ req }: any) => {
      return { req };
    },
    introspection: true,
  });

  await server.start();
  logger.info('Apollo Server started successfully');
  
  server.applyMiddleware({ 
    app: app as any,
    path: '/graphql',
    cors: true 
  });
  
  return server;
};

// Start the Apollo Server
startApolloServer().catch(error => {
  logger.error('Failed to start Apollo Server:', error);
});

export default app;