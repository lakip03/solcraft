package me.acimovic.solcraftPlugin

import org.bukkit.command.Command
import org.bukkit.command.CommandExecutor
import org.bukkit.command.CommandSender
import org.bukkit.entity.Player

/**
 * Command that allows players to check their linked wallet address
 * Usage: /mywallet
 */
class MyWalletCommand(private val plugin: SolcraftPlugin) : CommandExecutor {
    override fun onCommand(sender: CommandSender, command: Command, label: String, args: Array<out String>): Boolean {
        // Check if command sender is a player
        if (sender !is Player) {
            sender.sendMessage("§cThis command can only be used by players")
            return true
        }

        val uuid = sender.uniqueId.toString()
        sender.sendMessage("§6Checking your wallet... Please wait.")

        // Build GraphQL query
        val query = buildWalletQuery(uuid)

        // Send the request to backend
        queryWalletInfo(sender, uuid, query)

        return true
    }

    /**
     * Builds the GraphQL query to get wallet information
     */
    private fun buildWalletQuery(uuid: String): String {
        return """
            query {
              minecraftUser(uuid: "$uuid") {
                uuid
                walletAddress
              }
            }
        """.trimIndent()
    }

    /**
     * Sends the GraphQL request and handles the response
     */
    private fun queryWalletInfo(player: Player, uuid: String, query: String) {
        GraphQLService.sendRequest(plugin.backendUrl, query, plugin) { success, response ->
            if (success) {
                processSuccessResponse(player, response)
            } else {
                handleFailedRequest(player, uuid, response)
            }
        }
    }

    /**
     * Processes a successful API response
     */
    private fun processSuccessResponse(player: Player, response: String) {
        try {
            if (hasNoWallet(response)) {
                displayNoWalletMessage(player)
            } else {
                extractAndDisplayWallet(player, response)
            }
        } catch (e: Exception) {
            player.sendMessage("§cError processing server response. Please try again later.")
            plugin.logger.warning("Error processing wallet query response: ${e.message}")
        }
    }

    /**
     * Checks if the user has no wallet linked
     */
    private fun hasNoWallet(response: String): Boolean {
        return response.contains("\"walletAddress\":null") || !response.contains("walletAddress")
    }

    /**
     * Displays message when no wallet is linked
     */
    private fun displayNoWalletMessage(player: Player) {
        player.sendMessage("§eYou don't have a wallet linked to your account yet.")
        player.sendMessage("§eUse §6/setwallet <address> §eto link a wallet.")
    }

    /**
     * Extracts and displays the wallet address
     */
    private fun extractAndDisplayWallet(player: Player, response: String) {
        val walletAddressPattern = "\"walletAddress\":\"([^\"]+)\"".toRegex()
        val matchResult = walletAddressPattern.find(response)

        if (matchResult != null) {
            val walletAddress = matchResult.groupValues[1]
            player.sendMessage("§aYour linked wallet address: §6$walletAddress")
        } else {
            player.sendMessage("§cError extracting wallet information. Please try again later.")
            plugin.logger.warning("Failed to extract wallet address from response: $response")
        }
    }

    /**
     * Handles a failed API request
     */
    private fun handleFailedRequest(player: Player, uuid: String, response: String) {
        player.sendMessage("§cFailed to retrieve wallet information. Please try again later.")
        plugin.logger.warning("Failed to retrieve wallet for player $uuid: $response")
    }
}