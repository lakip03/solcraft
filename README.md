# 🌟 SolCraft: Minecraft-Solana Integration

**A full-stack blockchain integration for Minecraft that bridges gameplay with Solana cryptocurrency**

![Version](https://img.shields.io/badge/version-1.0--SNAPSHOT-blue)
![API](https://img.shields.io/badge/Minecraft%20API-1.21-green)
![License](https://img.shields.io/badge/license-MIT-yellow)
![Status](https://img.shields.io/badge/status-experimental-orange)

## ⚠️ DISCLAIMER

This project is currently in development and is **NOT** production-ready. Do not deploy this on actual Minecraft servers with real players or use with non-test Solana wallets.

### **MINECRAFT EULA WARNING** 
This project likely violates the Minecraft End User License Agreement (EULA) which prohibits using Minecraft to generate cryptocurrency or other forms of real-world currency. This integration is meant for educational and demonstration purposes only as a technical proof of concept.

**I am not responsible for any loss of funds, server issues, or legal problems that might arise from improper use or violations of the Minecraft EULA.**

## 🚀 Project Overview

SolCraft seamlessly integrates Solana blockchain functionality directly into Minecraft, creating a unique intersection of gaming and blockchain technology. Players can link wallets, trade in-game diamonds for blockchain tokens, and manage their crypto assets — all from within the Minecraft interface.

This project showcases:
- Practical blockchain integration in gaming environments
- Modern Kotlin & Node.js development with TypeScript
- Full-stack architecture connecting game clients to blockchain networks
- GraphQL API implementation for efficient data operations

## ✨ Key Features

- **Wallet Management**: Link/unlink Solana wallets to Minecraft UUIDs
- **Token System**: Trade in-game diamonds for blockchain tokens
- **Balance Checking**: View token balances from within Minecraft
- **GraphQL API**: Comprehensive API for all player and token operations
- **Security**: UUID-based player verification and secure transactions

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express and TypeScript
- **GraphQL** with Apollo Server
- **SQLite** with Sequelize ORM
- **Solana** blockchain integration with SPL Token support

### Minecraft Plugin
- **Kotlin**: Modern, concise JVM language with robust null safety
- **Bukkit/Spigot API**: Minecraft server plugin development
- **Asynchronous Programming**: Non-blocking I/O operations


## 📊 GraphQL API

The project includes a comprehensive GraphQL API for managing Minecraft users and their Solana tokens:

### Queries
- Get all Minecraft users
- Find Minecraft user by UUID
- Find user by wallet address
- Check token balances
- Retrieve token mint information
- Run diagnostic checks

### Mutations
- Link/unlink wallet to Minecraft UUID
- Mint tokens to player by UUID
- Mint tokens directly to wallet

### Example Queries

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

### Example Mutations

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

## 🔒 Technical Implementation

### Architecture Highlights

- **Service-Oriented Design**: Modular components with clear responsibilities
- **Full-Stack Integration**: Seamless connection between game client and blockchain
- **Async Request Handling**: Non-blocking HTTP requests for responsive gameplay
- **Error Handling**: Robust exception management and user feedback
- **Transaction Security**: Safe handling of in-game transactions with rollback capability

### Key Components

- **GraphQLService**: Core communication layer for API interactions
- **Command Handlers**: Individual executors for each blockchain-related command
- **Transaction Processing**: Safe exchange of in-game items for blockchain tokens
- **Token Management**: Secure creation and transfer of SPL tokens on Solana

## 🔐 Security Considerations

While this project is experimental, it implements several security measures:

- Private keys are never exposed to the client
- UUID validation prevents impersonation
- Transaction signing happens server-side
- Rate limiting prevents abuse
- Rollback mechanisms for failed transactions

## 🔮 Future Possibilities

- Enhanced token usage within gameplay
- NFT integration for unique in-game items
- Marketplace functionality for player-to-player trading
- Web dashboard for players to manage tokens
- Multi-token support for different in-game currencies


## 📋 Requirements

- Minecraft server running version 1.21 or later
- Node.js v14+ for the backend
- Java 17 or higher for the plugin
- Access to Solana devnet or testnet

---

This project demonstrates practical blockchain integration, modern full-stack development, and scalable architecture—showcasing both technical excellence and innovative gameplay possibilities.
