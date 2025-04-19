import * as web3 from "@solana/web3.js";
import * as splToken from "@solana/spl-token";
import bs58 from "bs58";
import logger from "../utils/logger";

export interface TokenDetails {
  mintAddress: string;
  tokenName: string;
  tokenSymbol: string;
  decimals: number;
}

/**
 * Service for interacting with Solana tokens
 */
export class SolanaTokenService {
  private connection: web3.Connection;
  private tokenMint: web3.PublicKey;
  private payer: web3.Keypair;
  
  // Standard SPL Token Program ID
  private readonly SPL_TOKEN_PROGRAM_ID = new web3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
  
  // Custom token program ID
  private readonly CUSTOM_TOKEN_PROGRAM_ID = new web3.PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');

  /**
   * Initialize the Solana token service
   * @param rpcUrl The Solana RPC URL
   * @param mintAddress The token mint address
   * @param payerPrivateKey Base58 encoded private key for the payer account
   */
  constructor(
    rpcUrl: string,
    tokenDetails: TokenDetails,
    payerPrivateKey: string
  ) {
    this.connection = new web3.Connection(rpcUrl, "confirmed");
    this.tokenMint = new web3.PublicKey(tokenDetails.mintAddress);

    try {
      // Use our custom helper to decode the base58 private key
      const decodedKey = bs58.decode(payerPrivateKey);
      this.payer = web3.Keypair.fromSecretKey(decodedKey);
      logger.info(
        `SolanaTokenService initialized with mint: ${this.tokenMint.toString()}`
      );
      logger.info(`Connected to Solana network at: ${rpcUrl}`);
      logger.info(`Custom token program ID: ${this.CUSTOM_TOKEN_PROGRAM_ID.toString()}`);
    } catch (error) {
      logger.error("Could not decode private key", error);
      throw new Error(
        "Failed to decode private key. Check private key format."
      );
    }
  }

  /**
   * Get token account for a wallet based on mint
   * This method checks for accounts under both the standard and custom token programs
   */
  async getTokenAccount(walletAddress: string): Promise<web3.PublicKey | null> {
    try {
      const walletPublicKey = new web3.PublicKey(walletAddress);

      // First try with custom token program
      logger.info(`Looking for token account with custom program ${this.CUSTOM_TOKEN_PROGRAM_ID}`);
      let tokenAccounts = await this.connection.getTokenAccountsByOwner(
        walletPublicKey,
        { 
          mint: this.tokenMint,
          programId: this.CUSTOM_TOKEN_PROGRAM_ID
        }
      );

      if (tokenAccounts.value.length > 0) {
        logger.info(`Found token account with custom program: ${tokenAccounts.value[0].pubkey}`);
        return tokenAccounts.value[0].pubkey;
      }

      // If not found, try with standard SPL token program
      logger.info(`Looking for token account with standard program ${this.SPL_TOKEN_PROGRAM_ID}`);
      tokenAccounts = await this.connection.getTokenAccountsByOwner(
        walletPublicKey,
        { 
          mint: this.tokenMint,
          programId: this.SPL_TOKEN_PROGRAM_ID
        }
      );

      if (tokenAccounts.value.length > 0) {
        logger.info(`Found token account with standard program: ${tokenAccounts.value[0].pubkey}`);
        return tokenAccounts.value[0].pubkey;
      }

      logger.info(`No token account found for wallet ${walletAddress}`);
      return null;
    } catch (error) {
      logger.error(`Error getting token account: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a token account for a wallet if it doesn't exist
   */
  async createTokenAccountIfNeeded(
    walletAddress: string
  ): Promise<web3.PublicKey> {
    try {
      const walletPublicKey = new web3.PublicKey(walletAddress);

      // Check if token account already exists
      const existingAccount = await this.getTokenAccount(walletAddress);
      if (existingAccount) {
        return existingAccount;
      }

      // Create a new token account using the custom token program
      logger.info(`Creating new token account for wallet: ${walletAddress}`);
      
      // Generate the expected token account address
      // Note: This depends on how your custom program determines the PDA
      const associatedTokenAddress = await this.getCustomTokenAddress(
        this.tokenMint,
        walletPublicKey
      );

      // Create the appropriate instruction for your custom token program
      const transaction = new web3.Transaction().add(
        this.createCustomTokenAccountInstruction(
          this.payer.publicKey,
          associatedTokenAddress,
          walletPublicKey,
          this.tokenMint
        )
      );

      const signature = await web3.sendAndConfirmTransaction(
        this.connection,
        transaction,
        [this.payer]
      );

      logger.info(
        `Created token account: ${associatedTokenAddress.toString()}, Signature: ${signature}`
      );
      return associatedTokenAddress;
    } catch (error) {
      logger.error(`Error creating token account: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get the token account address for the custom token program
   */
  private async getCustomTokenAddress(
    mint: web3.PublicKey,
    owner: web3.PublicKey
  ): Promise<web3.PublicKey> {
    // Try using the standard ATA calculation with the custom program ID
    try {
      // First try using standard ATA with custom program
      return await splToken.getAssociatedTokenAddress(
        mint,
        owner,
        false,
        this.CUSTOM_TOKEN_PROGRAM_ID,
        this.CUSTOM_TOKEN_PROGRAM_ID
      );
    } catch (error) {
      // If that fails, the custom program might have a different PDA derivation
      logger.warn(`Failed to derive ATA with custom program ID: ${error.message}`);
      
      // As a fallback, use the standard method
      return await splToken.getAssociatedTokenAddress(
        mint,
        owner,
        false
      );
    }
  }

  /**
   * Create a token account instruction for the custom token program
   */
  private createCustomTokenAccountInstruction(
    payer: web3.PublicKey,
    associatedToken: web3.PublicKey,
    owner: web3.PublicKey,
    mint: web3.PublicKey
  ): web3.TransactionInstruction {
    try {
      // Try using standard instruction but with custom program ID
      return splToken.createAssociatedTokenAccountInstruction(
        payer,
        associatedToken,
        owner,
        mint,
        this.CUSTOM_TOKEN_PROGRAM_ID,
        this.CUSTOM_TOKEN_PROGRAM_ID
      );
    } catch (error) {
      // If that fails, log and fall back to standard program
      logger.warn(`Falling back to standard token program for instruction: ${error.message}`);
      return splToken.createAssociatedTokenAccountInstruction(
        payer,
        associatedToken,
        owner,
        mint
      );
    }
  }

  /**
   * Mint tokens to a wallet address
   * @param walletAddress Recipient wallet address
   * @param amount Amount to mint (in token units, not lamports)
   * @returns Transaction signature
   */
  async mintTokens(walletAddress: string, amount: number): Promise<string> {
    try {
      // Get recipient public key
      const recipientPubkey = new web3.PublicKey(walletAddress);

      // Find associated token account - check both program IDs
      let associatedTokenAddress;
      const existingAccount = await this.getTokenAccount(walletAddress);
      
      if (existingAccount) {
        associatedTokenAddress = existingAccount;
        logger.info(`Using existing token account: ${associatedTokenAddress.toString()}`);
      } else {
        // Get the address where we would expect the token account to be
        associatedTokenAddress = await this.getCustomTokenAddress(
          this.tokenMint,
          recipientPubkey
        );
        logger.info(`Generated token account address: ${associatedTokenAddress.toString()}`);
      }

      // Check if the token account exists
      const tokenAccountInfo = await this.connection.getAccountInfo(
        associatedTokenAddress
      );

      // Create token account if it doesn't exist
      let transaction = new web3.Transaction();

      if (!tokenAccountInfo) {
        logger.info(`Creating associated token account for ${walletAddress}`);
        transaction.add(
          this.createCustomTokenAccountInstruction(
            this.payer.publicKey,
            associatedTokenAddress,
            recipientPubkey,
            this.tokenMint
          )
        );
      }

      // Determine which program ID owns the mint
      const mintAccountInfo = await this.connection.getAccountInfo(this.tokenMint);
      if (!mintAccountInfo) {
        throw new Error(`Mint account not found: ${this.tokenMint.toString()}`);
      }
      
      const mintProgramId = mintAccountInfo.owner;
      logger.info(`Mint account owned by program: ${mintProgramId.toString()}`);

      // Get mint info to calculate the correct amount
      let mintDecimals;
      try {
        // Try with the program ID that owns the mint
        const mintInfo = await splToken.getMint(
          this.connection, 
          this.tokenMint,
          undefined,
          mintProgramId
        );
        mintDecimals = mintInfo.decimals;
      } catch (error) {
        logger.warn(`Error getting mint info, assuming 9 decimals: ${error.message}`);
        mintDecimals = 9; // Default to 9 decimals if we can't get the actual value
      }

      // Calculate amount with proper decimal places
      const amountInSmallestUnits = BigInt(
        Math.floor(amount * Math.pow(10, mintDecimals))
      );

      // Add mint instruction using the appropriate program ID
      transaction.add(
        this.createMintToInstruction(
          this.tokenMint,
          associatedTokenAddress,
          this.payer.publicKey,
          amountInSmallestUnits,
          mintProgramId
        )
      );

      // Send and confirm transaction
      const signature = await web3.sendAndConfirmTransaction(
        this.connection,
        transaction,
        [this.payer]
      );

      logger.info(`Mint transaction successful: ${signature}`);
      return signature;
    } catch (error) {
      logger.error(`Error in mintTokens: ${error.message}`);
      if (error.stack) {  
        logger.error(`Stack trace: ${error.stack}`);
      }
      throw error;
    }
  }

  /**
   * Create a mint-to instruction for the appropriate token program
   */
  private createMintToInstruction(
    mint: web3.PublicKey,
    destination: web3.PublicKey,
    authority: web3.PublicKey,
    amount: bigint,
    programId: web3.PublicKey
  ): web3.TransactionInstruction {
    // Check if we're using the custom program
    if (programId.equals(this.CUSTOM_TOKEN_PROGRAM_ID)) {
      logger.info(`Using custom token program for mint-to instruction`);
      
      // Use splToken with custom program ID
      return splToken.createMintToInstruction(
        mint,
        destination,
        authority,
        amount,
        [],
        this.CUSTOM_TOKEN_PROGRAM_ID
      );
    } else {
      // Use standard SPL token program
      logger.info(`Using standard token program for mint-to instruction`);
      return splToken.createMintToInstruction(
        mint,
        destination,
        authority,
        amount
      );
    }
  }

  /**
   * Get token balance for a wallet
   */
  async getTokenBalance(walletAddress: string): Promise<number> {
    try {
      const tokenAccount = await this.getTokenAccount(walletAddress);

      if (!tokenAccount) {
        logger.info(`No token account found for ${walletAddress}, returning 0 balance`);
        return 0;
      }

      // Get token account balance
      const accountInfo = await this.connection.getTokenAccountBalance(tokenAccount);

      // Handle the case where uiAmount could be null
      if (accountInfo.value.uiAmount === null) {
        return 0;
      }

      logger.info(`Token balance for ${walletAddress}: ${accountInfo.value.uiAmount}`);
      return parseFloat(accountInfo.value.uiAmount.toString());
    } catch (error) {
      logger.error(`Error getting token balance: ${error.message}`);
      throw error;
    }
  }
}

// Create singleton instance
let tokenService: SolanaTokenService | null = null;

/**
 * Initialize the token service with configuration
 */
export function initializeTokenService(): SolanaTokenService {
  if (tokenService) {
    return tokenService;
  }

  // Default to devnet for safety
  const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
  const mintAddress = process.env.TOKEN_MINT_ADDRESS;
  const tokenName = process.env.TOKEN_NAME || "Minecraft Token";
  const tokenSymbol = process.env.TOKEN_SYMBOL || "MCFT";
  const decimals = parseInt(process.env.TOKEN_DECIMALS || "9");
  const payerPrivateKey = process.env.PAYER_PRIVATE_KEY;

  if (!mintAddress) {
    throw new Error("TOKEN_MINT_ADDRESS environment variable not set");
  }

  if (!payerPrivateKey) {
    throw new Error("PAYER_PRIVATE_KEY environment variable not set");
  }

  tokenService = new SolanaTokenService(
    rpcUrl,
    { mintAddress, tokenName, tokenSymbol, decimals },
    payerPrivateKey
  );

  return tokenService;
}

/**
 * Get the token service instance
 */
export function getTokenService(): SolanaTokenService {
  if (!tokenService) {
    return initializeTokenService();
  }
  return tokenService;
}