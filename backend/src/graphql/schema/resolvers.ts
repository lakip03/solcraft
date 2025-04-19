/**
 * GraphQL Resolvers for Minecraft User and Solana Token Operations
 * 
 * This file contains resolvers for GraphQL queries and mutations that handle:
 * - Minecraft user management
 * - Wallet linking/unlinking
 * - Token operations (balance checking, minting)
 * - Diagnostic functions
 */

import { MinecraftUser } from '../../db/models/MinecraftUser';
import sequelize from '../../config/database';
import logger from '../../utils/logger';
import { getTokenService } from '../../services/solana-token-service';
import { diagnoseMintIssue } from '../../services/mint-diagnostic';

// Initialize Sequelize with models
sequelize.addModels([MinecraftUser]);

/**
 * Mock Solana data for development/testing purposes
 * TO BE REPLACED with actual implementation
 */
const mockSolanaData = {
  getSolanaBalance: (walletAddress: string): number => {
    // Mock function to return SOL balance
    return 1.5; // Mocked SOL balance
  },
  
  getUserTokens: (walletAddress: string): any[] => {
    // Mock function to return user tokens
    return [
      { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', amount: 100, decimals: 6, symbol: 'USDC', name: 'USD Coin' },
      { mint: 'So11111111111111111111111111111111111111112', amount: 0.5, decimals: 9, symbol: 'SOL', name: 'Wrapped SOL' }
    ];
  }
};

const resolvers = {
  Query: {
    /**
     * Get all Minecraft users
     * @returns {Promise<MinecraftUser[]>} All registered Minecraft users
     */
    minecraftUsers: async () => {
      try {
        logger.info('Querying all Minecraft users');
        return await MinecraftUser.findAll();
      } catch (error) {
        logger.error('Error fetching Minecraft users:', error);
        throw new Error(`Failed to fetch Minecraft users: ${error.message}`);
      }
    },
    
    /**
     * Get a Minecraft user by UUID
     * @param {any} _ - Parent resolver (not used)
     * @param {Object} params - Query parameters
     * @param {string} params.uuid - Minecraft user UUID
     * @returns {Promise<MinecraftUser|null>} The Minecraft user or null if not found
     */
    minecraftUser: async (_: any, { uuid }: { uuid: string }) => {
      try {
        return await MinecraftUser.findByPk(uuid);
      } catch (error) {
        logger.error(`Error fetching Minecraft user with UUID ${uuid}:`, error);
        throw new Error(`Failed to fetch Minecraft user: ${error.message}`);
      }
    },
    
    /**
     * Get a Minecraft user by wallet address
     * @param {any} _ - Parent resolver (not used)
     * @param {Object} params - Query parameters
     * @param {string} params.walletAddress - Solana wallet address
     * @returns {Promise<MinecraftUser|null>} The Minecraft user or null if not found
     */
    userByWallet: async (_: any, { walletAddress }: { walletAddress: string }) => {
      try {
        return await MinecraftUser.findOne({ where: { walletAddress } });
      } catch (error) {
        logger.error(`Error fetching user with wallet ${walletAddress}:`, error);
        throw new Error(`Failed to fetch user by wallet: ${error.message}`);
      }
    },
    
    /**
     * Get token balance for a wallet address
     * @param {any} _ - Parent resolver (not used)
     * @param {Object} params - Query parameters
     * @param {string} params.walletAddress - Solana wallet address
     * @returns {Promise<number>} Token balance for the specified wallet
     */
    tokenBalance: async (_: any, { walletAddress }: { walletAddress: string }) => {
      try {
        const tokenService = getTokenService();
        return await tokenService.getTokenBalance(walletAddress);
      } catch (error) {
        logger.error(`Error fetching token balance for ${walletAddress}:`, error);
        throw new Error(`Failed to fetch token balance: ${error.message}`);
      }
    },
    
    /**
     * Get token balance for a player using their Minecraft UUID
     * @param {any} _ - Parent resolver (not used)
     * @param {Object} params - Query parameters
     * @param {string} params.uuid - Minecraft user UUID
     * @returns {Promise<Object>} Object containing balance info and status
     */
    playerTokenBalance: async (_: any, { uuid }: { uuid: string }) => {
      try {
        logger.info(`Fetching token balance for player with UUID: ${uuid}`);
        
        // Step 1: Find user by UUID
        const user = await MinecraftUser.findByPk(uuid);
        
        // Handle case when user is not found
        if (!user) {
          logger.warn(`User with UUID ${uuid} not found`);
          return {
            uuid,
            walletAddress: null,
            balance: 0,
            success: false,
            error: 'User not found'
          };
        }
        
        // Handle case when user doesn't have a linked wallet
        if (!user.walletAddress) {
          logger.warn(`User with UUID ${uuid} does not have a linked wallet`);
          return {
            uuid,
            walletAddress: null, 
            balance: 0,
            success: false,
            error: 'No wallet linked to this account'
          };
        }
        
        // Step 2: Get token balance for the wallet
        const tokenService = getTokenService();
        const balance = await tokenService.getTokenBalance(user.walletAddress);
        
        // Return successful response
        return {
          uuid,
          walletAddress: user.walletAddress,
          balance,
          success: true,
          error: null
        };
      } catch (error) {
        // Handle unexpected errors
        logger.error(`Error fetching token balance for UUID ${uuid}:`, error);
        return {
          uuid,
          walletAddress: null,
          balance: 0,
          success: false,
          error: `Error fetching token balance: ${error.message}`
        };
      }
    },
    
    /**
     * Get information about the token mint
     * @returns {Promise<Object>} Token mint information
     */
    tokenMintInfo: async () => {
      try {
        return {
          mintAddress: process.env.TOKEN_MINT_ADDRESS,
          tokenName: process.env.TOKEN_NAME || 'Minecraft Token',
          tokenSymbol: process.env.TOKEN_SYMBOL || 'MCFT',
          decimals: parseInt(process.env.TOKEN_DECIMALS || '9'),
          totalSupply: 0, // This would require additional on-chain query to get the actual total supply which I won't do for just this implementation 
        };
      } catch (error) {
        logger.error(`Error fetching token mint info:`, error);
        throw new Error(`Failed to fetch token mint info: ${error.message}`);
      }
    },
    
    /**
     * Run diagnostics on token minting functionality
     * @returns {Promise<Object>} Diagnostic results
     */
    diagnoseMint: async () => {
      try {
        return await diagnoseMintIssue();
      } catch (error) {
        logger.error('Error running mint diagnostics:', error);
        return {
          success: false,
          error: error.message,
          details: null
        };
      }
    }
  },
  
  Mutation: {
    /**
     * Link a wallet address to a Minecraft user
     * @param {any} _ - Parent resolver (not used)
     * @param {Object} params - Mutation parameters
     * @param {string} params.uuid - Minecraft user UUID
     * @param {string} params.walletAddress - Solana wallet address
     * @returns {Promise<MinecraftUser>} Updated Minecraft user
     */
    linkWallet: async (_: any, { uuid, walletAddress }: { uuid: string, walletAddress: string }) => {
      try {
        let user = await MinecraftUser.findByPk(uuid);
        
        // Create new user if not found
        if (!user) {
          user = await MinecraftUser.create({ uuid, walletAddress });
          logger.info(`Created new user with UUID ${uuid} and wallet ${walletAddress}`);
          return user;
        }
        
        // Update existing user's wallet
        user.walletAddress = walletAddress;
        await user.save();
        logger.info(`Updated user ${uuid} with new wallet ${walletAddress}`);
        return user;
      } catch (error) {
        logger.error(`Error linking wallet ${walletAddress} to UUID ${uuid}:`, error);
        throw new Error(`Failed to link wallet: ${error.message}`);
      }
    },

    /**
     * Mint tokens directly to a player's wallet using their Minecraft UUID
     * @param {any} _ - Parent resolver (not used)
     * @param {Object} params - Mutation parameters
     * @param {string} params.uuid - Minecraft user UUID
     * @param {number} params.amount - Amount of tokens to mint
     * @returns {Promise<Object>} Result of minting operation
     */
    mintTokensToPlayer: async (_: any, { uuid, amount }: { uuid: string, amount: number }) => {
      try {
        logger.info(`Attempting to mint ${amount} tokens to player with UUID: ${uuid}`);
        
        // Validate amount
        if (amount <= 0) {
          return {
            success: false,
            error: 'Amount must be greater than zero',
            amount,
            recipient: uuid
          };
        }
        
        // Find player by UUID
        const player = await MinecraftUser.findByPk(uuid);
        
        // Handle player not found
        if (!player) {
          logger.warn(`Player with UUID ${uuid} not found`);
          return {
            success: false,
            error: 'Player not found',
            amount,
            recipient: uuid
          };
        }
        
        // Handle player without linked wallet
        if (!player.walletAddress) {
          logger.warn(`Player with UUID ${uuid} does not have a linked wallet`);
          return {
            success: false,
            error: 'No wallet linked to this player',
            amount,
            recipient: uuid
          };
        }
        
        // Get token service and mint tokens
        const tokenService = getTokenService();
        
        logger.info(`Minting ${amount} tokens to wallet ${player.walletAddress} for player ${uuid}`);
        const signature = await tokenService.mintTokens(player.walletAddress, amount);
        
        // Return successful result
        return {
          success: true,
          signature,
          amount,
          recipient: player.walletAddress
        };
      } catch (error) {
        // Handle unexpected errors
        logger.error(`Error minting tokens to player ${uuid}:`, error);
        return {
          success: false,
          error: `Failed to mint tokens: ${error.message}`,
          amount,
          recipient: uuid
        };
      }
    },
    
    /**
     * Unlink a wallet from a Minecraft user
     * @param {any} _ - Parent resolver (not used)
     * @param {Object} params - Mutation parameters
     * @param {string} params.uuid - Minecraft user UUID
     * @returns {Promise<MinecraftUser>} Updated Minecraft user
     */
    unlinkWallet: async (_: any, { uuid }: { uuid: string }) => {
      try {
        const user = await MinecraftUser.findByPk(uuid);
        
        if (!user) {
          throw new Error('User not found');
        }
        
        // Set wallet address to null
        user.walletAddress = null;
        await user.save();
        logger.info(`Unlinked wallet from user ${uuid}`);
        return user;
      } catch (error) {
        logger.error(`Error unlinking wallet from UUID ${uuid}:`, error);
        throw new Error(`Failed to unlink wallet: ${error.message}`);
      }
    },
    
    /**
     * Mint tokens directly to a wallet address
     * @param {any} _ - Parent resolver (not used)
     * @param {Object} params - Mutation parameters
     * @param {string} params.walletAddress - Solana wallet address
     * @param {number} params.amount - Amount of tokens to mint
     * @returns {Promise<Object>} Result of minting operation
     */
    mintToken: async (_: any, { walletAddress, amount }: { walletAddress: string, amount: number }) => {
      try {
        // Validate amount
        if (amount <= 0) {
          return {
            success: false,
            error: 'Amount must be greater than zero',
            amount,
            recipient: walletAddress
          };
        }
        
        // Get token service and mint tokens
        const tokenService = getTokenService();
        const signature = await tokenService.mintTokens(walletAddress, amount);
        
        // Return successful result
        return {
          success: true,
          signature,
          amount,
          recipient: walletAddress
        };
      } catch (error) {
        // Handle unexpected errors
        logger.error(`Error minting tokens to ${walletAddress}:`, error);
        return {
          success: false,
          error: `Failed to mint tokens: ${error.message}`,
          amount,
          recipient: walletAddress
        };
      }
    }
  }
};

export default resolvers;