import * as web3 from '@solana/web3.js';
import * as splToken from '@solana/spl-token';
import logger from '../utils/logger';
import bs58 from "bs58";

/**
 * Run enhanced diagnostic checks on the token mint configuration
 * @returns Comprehensive diagnostic information about the mint and connection
 */
export async function diagnoseMintIssue(): Promise<any> {
  try {
    // Get configuration
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    const mintAddressStr = process.env.TOKEN_MINT_ADDRESS || '';
    const payerPrivateKeyStr = process.env.PAYER_PRIVATE_KEY || '';
    
    logger.info(`Running diagnostics with RPC URL: ${rpcUrl}`);
    logger.info(`Using mint address: ${mintAddressStr}`);
    
    // Validate mint address
    if (!mintAddressStr) {
      return {
        success: false,
        error: 'TOKEN_MINT_ADDRESS environment variable is not set',
        details: {
          rpcUrl,
          mintAddress: null
        }
      };
    }
    
    // Check payer key
    if (!payerPrivateKeyStr) {
      return {
        success: false,
        error: 'PAYER_PRIVATE_KEY environment variable is not set',
        details: {
          rpcUrl,
          mintAddress: mintAddressStr
        }
      };
    }
    
    // Decode payer public key for verification
    let payerPublicKey: string;
    try {
      // Only try to derive public key from private key
      const payerKeypair = getKeypairFromBase58(payerPrivateKeyStr);
      payerPublicKey = payerKeypair.publicKey.toString();
      logger.info(`Decoded payer public key: ${payerPublicKey}`);
    } catch (error) {
      return {
        success: false,
        error: `Invalid payer private key: ${error.message}`,
        details: {
          rpcUrl,
          mintAddress: mintAddressStr
        }
      };
    }
    
    // Check if mint address is valid
    let mintAddress: web3.PublicKey;
    try {
      mintAddress = new web3.PublicKey(mintAddressStr);
      logger.info(`Mint address validated: ${mintAddress.toString()}`);
    } catch (error) {
      return {
        success: false,
        error: `Invalid mint address format: ${error.message}`,
        details: {
          rpcUrl,
          mintAddress: mintAddressStr
        }
      };
    }
    
    // Create connection and check it
    const connection = new web3.Connection(rpcUrl, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000
    });
    
    try {
      const version = await connection.getVersion();
      logger.info(`Connected to Solana RPC, version: ${JSON.stringify(version)}`);
    } catch (error) {
      return {
        success: false,
        error: `Failed to connect to Solana RPC: ${error.message}`,
        details: {
          rpcUrl,
          mintAddress: mintAddress.toString()
        }
      };
    }
    
    // Check if mint exists
    try {
      const mintAccountInfo = await connection.getAccountInfo(mintAddress);
      if (!mintAccountInfo) {
        return {
          success: false,
          error: `Mint account does not exist on this network`,
          details: {
            rpcUrl,
            mintAddress: mintAddress.toString(),
            network: getNetworkName(rpcUrl)
          }
        };
      }
      
      // Examine the actual owner
      const ownerAddress = mintAccountInfo.owner.toString();
      const spl_token_program_id = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
      const isOwnedByTokenProgram = ownerAddress === spl_token_program_id;
      
      logger.info(`Mint account found with ${mintAccountInfo.data.length} bytes of data`);
      logger.info(`Owner program: ${ownerAddress}`);
      logger.info(`Is owned by SPL Token Program: ${isOwnedByTokenProgram}`);
      
      // Examine first few bytes of data
      const dataHex = Buffer.from(mintAccountInfo.data).toString('hex');
      logger.info(`Data preview (hex): ${dataHex.substring(0, 50)}...`);
      
      // Try to get actual mint info if owned by token program
      if (isOwnedByTokenProgram) {
        try {
          const mintInfo = await splToken.getMint(connection, mintAddress);
          
          const mintAuthorityStr = mintInfo.mintAuthority?.toString() || null;
          const isMintAuthority = mintAuthorityStr === payerPublicKey;
          
          return {
            success: true,
            details: {
              mintAddress: mintAddress.toString(),
              rpcUrl,
              network: getNetworkName(rpcUrl),
              owner: {
                address: ownerAddress,
                isTokenProgram: isOwnedByTokenProgram
              },
              payerInfo: {
                publicKey: payerPublicKey,
                isMintAuthority: isMintAuthority
              },
              mintInfo: {
                decimals: mintInfo.decimals,
                isInitialized: mintInfo.isInitialized,
                mintAuthority: mintAuthorityStr,
                freezeAuthority: mintInfo.freezeAuthority?.toString() || null,
                supply: mintInfo.supply.toString()
              },
              dataPreview: {
                hex: dataHex.substring(0, 100),
                length: mintAccountInfo.data.length
              }
            }
          };
        } catch (mintError) {
          // This case is interesting: owned by token program but can't get mint info
          return {
            success: false,
            error: `Account is owned by SPL Token Program but failed to parse as mint: ${mintError.message}`,
            details: {
              rpcUrl,
              mintAddress: mintAddress.toString(),
              network: getNetworkName(rpcUrl),
              owner: {
                address: ownerAddress,
                isTokenProgram: isOwnedByTokenProgram
              },
              payerInfo: {
                publicKey: payerPublicKey
              },
              dataPreview: {
                hex: dataHex.substring(0, 100),
                length: mintAccountInfo.data.length
              }
            }
          };
        }
      } else {
        // Not owned by token program
        return {
          success: false,
          error: `Account exists but is not owned by the SPL Token Program`,
          details: {
            rpcUrl,
            mintAddress: mintAddress.toString(),
            network: getNetworkName(rpcUrl),
            owner: {
              address: ownerAddress,
              isTokenProgram: false,
              expectedTokenProgram: spl_token_program_id
            },
            payerInfo: {
              publicKey: payerPublicKey
            },
            dataPreview: {
              hex: dataHex.substring(0, 100),
              length: mintAccountInfo.data.length
            }
          }
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Error checking mint account: ${error.message}`,
        details: {
          rpcUrl,
          mintAddress: mintAddress.toString(),
          network: getNetworkName(rpcUrl)
        }
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Unexpected error during diagnostics: ${error.message}`,
      stack: error.stack
    };
  }
}

/**
 * Get a human-readable network name from RPC URL
 */
function getNetworkName(rpcUrl: string): string {
  if (rpcUrl.includes('devnet')) return 'devnet';
  if (rpcUrl.includes('testnet')) return 'testnet';
  if (rpcUrl.includes('localhost') || rpcUrl.includes('127.0.0.1')) return 'localnet';
  return 'mainnet';
}

/**
 * Convert a base58 private key string to a Keypair
 */
function getKeypairFromBase58(privateKeyBase58: string): web3.Keypair {
  try {
    const decodedKey = bs58.decode(privateKeyBase58);
    return web3.Keypair.fromSecretKey(decodedKey);
  } catch (error) {
    throw new Error(`Could not decode private key: ${error.message}`);
  }
}