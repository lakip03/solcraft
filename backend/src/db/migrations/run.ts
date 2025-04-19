const sequelize = require('../../config/database');
const { User, Transaction } = require('../models');
const logger = require('../../utils/logger');

async function migrate() {
  try {
    await sequelize.sync({ force: true });
    logger.info('Database migration completed successfully');
    
    await User.create({
      username: 'testuser',
      walletAddress: '5FHwkrdxkRXbfYuXzJusqTji48gLezjNNMBacWCQkVG5'
    });
    
    logger.info('Sample data seeded');
    
  } catch (error) {
    logger.error('Migration failed:', error);
  } finally {
    process.exit();
  }
}

migrate();