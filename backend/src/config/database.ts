import { Sequelize } from 'sequelize-typescript';
import path from 'path';
import logger from '../utils/logger';
import { MinecraftUser } from '../db/models/MinecraftUser';

// Database path
const dbPath = path.resolve(__dirname, '../../../database.sqlite');


const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: msg => logger.debug(msg),
  models: [MinecraftUser], // This is important - explicitly adding the model
});

// Test database connection
async function testConnection(): Promise<void> {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    
    // Initialize models to ensures they're properly loaded
    sequelize.addModels([MinecraftUser]);
    logger.info('Models initialized successfully');
    
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
  }
}

testConnection();

export default sequelize;