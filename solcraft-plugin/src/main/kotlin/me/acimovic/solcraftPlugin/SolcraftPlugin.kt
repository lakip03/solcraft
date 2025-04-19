package me.acimovic.solcraftPlugin

import org.bukkit.Material
import org.bukkit.entity.Player
import org.bukkit.plugin.java.JavaPlugin

/**
 * Main plugin class for SolcraftPlugin - integrates Solana blockchain with Minecraft
 */
class SolcraftPlugin : JavaPlugin() {

    // Configuration properties
    val backendUrl = "http://localhost:4000/graphql"

    override fun onEnable() {
        // Register commands
        registerCommands()

        // Log plugin startup
        logger.info("SolcraftPlugin enabled PICKOOOOO successfully!")
    }

    /**
     * Registers all plugin commands
     */
    private fun registerCommands() {
        getCommand("setwallet")?.setExecutor(SetWalletCommand(this))
        getCommand("unlinkwallet")?.setExecutor(UnlinkWalletCommand(this))
        getCommand("howmany")?.setExecutor(HowManyCommand())
        getCommand("mywallet")?.setExecutor(MyWalletCommand(this))
        getCommand("balance")?.setExecutor(TokenBalanceCommand(this))
        getCommand("soltrade")?.setExecutor(SolTradeCommand(this))
    }

    /**
     * Links a wallet address to a player's account
     *
     * @param player The player to link the wallet to
     * @param walletAddress The wallet address to link
     * @param callback Callback function that receives success status and message
     */
    fun linkWallet(player: Player, walletAddress: String, callback: (Boolean, String) -> Unit) {
        val uuid = player.uniqueId.toString()

        logger.info("Attempting to link wallet for player $uuid with address $walletAddress")

        // Build the GraphQL mutation query
        val query = buildLinkWalletMutation(uuid, walletAddress)

        // Send the GraphQL request
        GraphQLService.sendRequest(backendUrl, query, this) { success, response ->
            if (success) {
                logger.info("Successfully linked wallet for player $uuid")
                callback(true, "Wallet linked successfully!")
            } else {
                logger.warning("Failed to link wallet for player $uuid: $response")
                callback(false, "Failed to link wallet: $response")
            }
        }
    }

    /**
     * Builds the GraphQL mutation for linking a wallet
     */
    private fun buildLinkWalletMutation(uuid: String, walletAddress: String): String {
        return """
            mutation {
              linkWallet(uuid: "$uuid", walletAddress: "$walletAddress") {
                uuid
                walletAddress
              }
            }
        """.trimIndent()
    }

    /**
     * Unlinks a wallet from a player's account
     *
     * @param player The player whose wallet should be unlinked
     * @param callback Callback function that receives success status and message
     */
    fun unlinkWallet(player: Player, callback: (Boolean, String) -> Unit) {
        val uuid = player.uniqueId.toString()

        logger.info("Attempting to unlink wallet for player $uuid")

        // Build the GraphQL mutation query
        val query = buildUnlinkWalletMutation(uuid)

        // Send the GraphQL request
        GraphQLService.sendRequest(backendUrl, query, this) { success, response ->
            if (success) {
                logger.info("Successfully unlinked wallet for player $uuid")
                callback(true, "Wallet unlinked successfully!")
            } else {
                logger.warning("Failed to unlink wallet for player $uuid: $response")
                callback(false, "Failed to unlink wallet: $response")
            }
        }
    }

    /**
     * Builds the GraphQL mutation for unlinking a wallet
     */
    private fun buildUnlinkWalletMutation(uuid: String): String {
        return """
            mutation {
              unlinkWallet(uuid: "$uuid") {
                uuid
                walletAddress
              }
            }
        """.trimIndent()
    }
}