import { gql } from 'apollo-server-express';

const typeDefs = gql`
  # For diagnostic results
  scalar JSON

  # MinecraftUser type
  type MinecraftUser {
    uuid: ID!
    walletAddress: String
    createdAt: String!
    updatedAt: String!
  }

  # Query type
  type Query {
    # User queries
    minecraftUsers: [MinecraftUser!]!
    minecraftUser(uuid: ID!): MinecraftUser
    userByWallet(walletAddress: String!): MinecraftUser
    
    # Solana on-chain data queries
    # These will call out to the Solana blockchain
    solanaBalance(walletAddress: String!): Float
    userTokens(walletAddress: String!): [SolanaToken!]!
    
    # Token specific queries
    tokenBalance(walletAddress: String!): Float
    tokenMintInfo: TokenMintInfo
    
    # NEW: Get token balance directly by UUID
    playerTokenBalance(uuid: ID!): PlayerTokenBalance
    
    # Diagnostic query
    diagnoseMint: DiagnosticResult!
  }
  
  # NEW: Player token balance result type
  type PlayerTokenBalance {
    uuid: ID!
    walletAddress: String
    balance: Float!
    success: Boolean!
    error: String
  }
  
  # Diagnostic result for mint issues
  type DiagnosticResult {
    success: Boolean!
    error: String
    details: JSON
  }

  # Solana Token type (fetched from blockchain)
  type SolanaToken {
    mint: String!
    amount: Float!
    decimals: Int!
    symbol: String
    name: String
  }
  
  # Token mint information
  type TokenMintInfo {
    mintAddress: String!
    tokenName: String!
    tokenSymbol: String!
    decimals: Int!
    totalSupply: Float
  }
  
  # Token mint result
  type TokenMintResult {
    success: Boolean!
    signature: String
    error: String
    amount: Float
    recipient: String
  }

  # Mutation type
  type Mutation {
    # User management
    linkWallet(uuid: ID!, walletAddress: String!): MinecraftUser!
    unlinkWallet(uuid: ID!): MinecraftUser!
    
    # Token operations
    mintToken(walletAddress: String!, amount: Float!): TokenMintResult!

     # NEW: Mint tokens directly to a player by UUID
     mintTokensToPlayer(uuid: ID!, amount: Float!): TokenMintResult!
  }
`;

export default typeDefs;