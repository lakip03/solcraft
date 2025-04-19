import dotenv from 'dotenv';
dotenv.config();
import app from './app';
import logger from './utils/logger';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
});