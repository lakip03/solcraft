package me.acimovic.solcraftPlugin

import org.bukkit.command.Command
import org.bukkit.command.CommandExecutor
import org.bukkit.command.CommandSender
import org.bukkit.entity.Player

class TokenBalanceCommand(private val plugin: SolcraftPlugin) : CommandExecutor {
    override fun onCommand(sender: CommandSender, command: Command, label: String, args: Array<out String>): Boolean {
        // Check if command sender is a player
        if (sender !is Player) {
            sender.sendMessage("This command can only be used by players")
            return true
        }

        val uuid = sender.uniqueId.toString()
        sender.sendMessage("Checking your token balance... Please wait.")

        // Query the GraphQL API to get the player's token balance
        val query = """
            query {
              playerTokenBalance(uuid: "$uuid") {
                uuid
                walletAddress
                balance
                success
                error
              }
            }
        """.trimIndent()

        GraphQLService.sendRequest(plugin.backendUrl, query, plugin) { success, response ->
            if (success) {
                try {
                    if (response.contains("\"success\":false")) {
                        // Extract error message if available
                        val errorPattern = "\"error\":\"([^\"]+)\"".toRegex()
                        val errorMatch = errorPattern.find(response)

                        if (errorMatch != null) {
                            val errorMessage = errorMatch.groupValues[1]
                            sender.sendMessage("§cCouldn't get token balance: $errorMessage")
                        } else {
                            sender.sendMessage("§cCouldn't get token balance. You may not have a wallet linked. $response")
                            sender.sendMessage("§cUse /setwallet <address> to link a wallet.")
                        }
                    } else {
                        // Extract the balance from the response
                        val balancePattern = "\"balance\":([\\d.]+)".toRegex()
                        val balanceMatch = balancePattern.find(response)

                        if (balanceMatch != null) {
                            val balance = balanceMatch.groupValues[1].toDoubleOrNull() ?: 0.0

                            // Format the balance nicely
                            val formattedBalance = if (balance == balance.toInt().toDouble()) {
                                balance.toInt()     .toString()
                            } else {
                                "%.2f".format(balance)
                            }

                            sender.sendMessage("§aYour token balance: §6$formattedBalance")
                        } else {
                            sender.sendMessage("§cError reading token balance. Please try again later.")
                            plugin.logger.warning("Failed to extract balance from response: $response")
                        }
                    }
                } catch (e: Exception) {
                    sender.sendMessage("§cError processing server response. Please try again later.")
                    plugin.logger.warning("Error processing token balance response: ${e.message}")
                    e.printStackTrace()
                }
            } else {
                sender.sendMessage("§cFailed to retrieve token balance. Please try again later.")
                plugin.logger.warning("Failed to retrieve token balance for player $uuid: $response")
            }
        }

        return true
    }
}