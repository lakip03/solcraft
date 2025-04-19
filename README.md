# Minecraft Solana Integration
A full-stack application that bridges the gap between Minecraft gameplay and Solana blockchain, allowing players to earn and manage in-game tokens backed by actual cryptocurrency.

## ⚠️ DISCLAIMER
This project is currently in development and is NOT production-ready. Do not deploy this on actual Minecraft servers with real players or use with non-test Solana wallets.

### **MINECRAFT EULA WARNING** 
This project likely violates the Minecraft End User License Agreement (EULA) which prohibits using Minecraft to generate cryptocurrency or other forms of real-world currency. This integration is meant for educational and demonstration purposes only as a technical proof of concept. Deploying this on a production Minecraft server could result in your server being shut down or other legal consequences.

**I am not responsible for any loss of funds, server issues, or legal problems that might arise from improper use or violations of the Minecraft EULA.**

# 🚀 Overview
This project integrates Minecraft with the Solana blockchain, giving players the ability to link their game accounts to Solana wallets and earn custom tokens. I built this as a way to explore the intersection of gaming and crypto, while learning more about both ecosystems.

### ✨ Key Features
- Minecraft UUID to Solana wallet address linking
- Custom token minting as rewards for in-game achievements
- GraphQL API for all token and player operations
- Token balance checking through player UUID or wallet address

### 🛠️ Tech Stack
- Backend: Node.js with Express and TypeScript
- API: GraphQL with Apollo Server
- Database: SQLite with Sequelize ORM
- Blockchain: Solana blockchain integration with SPL Token support
- Authentication: UUID-based player verification
- Logging: Winston for comprehensive logging
- Minecraft Plugin: Custom plugin for in-game integration (separate repository)

# 🔧 GraphQL API
The API endpoints I've built for managing Minecraft users and their Solana tokens:

Queries
- Get all Minecraft users
- Find Minecraft user by UUID
- Find user by wallet address
- Check token balances
- Retrieve token mint information
- Run diagnostic checks

Mutations
- Link/unlink wallet to Minecraft UUID
- Mint tokens to player by UUID
- Mint tokens directly to wallet

# 💰 Solana Integration
The project integrates with Solana blockchain in the following ways:
- Custom SPL token creation and management
- Association of token accounts with player wallets
- Secure token minting and transfers
- Support for both standard and custom token programs

# 📝 API Documentation
Once the server is running, you can access the GraphQL Playground at:  
``bash
http://localhost:4000/graphql
``
## Example Queries 
  
```graphql
  # Get all Minecraft users
  query {
    minecraftUsers {
      uuid
      walletAddress
    }
  }
  
  # Get token balance for a player
  query {
    playerTokenBalance(uuid: "player-uuid-here") {
      balance
      success
      walletAddress
    }
  }
```
## Example Mutations
```graphql
# Link wallet to Minecraft account
mutation {
  linkWallet(
    uuid: "player-uuid-here", 
    walletAddress: "solana-wallet-address-here"
  ) {
    uuid
    walletAddress
  }
}

# Mint tokens to player
mutation {
  mintTokensToPlayer(
    uuid: "player-uuid-here", 
    amount: 10.5
  ) {
    success
    signature
  }
}
```

# 🔐 Security Considerations
While this project is experimental, I've implemented several security measures:

Private keys are never exposed to the client
- UUID validation prevents impersonation
- Transaction signing happens server-side
- Rate limiting prevents abuse

# 🔮 Future Plans
Maybe in the future I will also implement this features 
- Multi-token support for different in-game currencies
- NFT integration for unique in-game items
- Web dashboard for players to manage tokens
- Token exchange functionality


