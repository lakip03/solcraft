package me.acimovic.solcraftPlugin

import org.bukkit.Material
import org.bukkit.command.Command
import org.bukkit.command.CommandExecutor
import org.bukkit.command.CommandSender
import org.bukkit.entity.Player
import org.bukkit.inventory.ItemStack

class SolTradeCommand(private val plugin: SolcraftPlugin) : CommandExecutor {
    override fun onCommand(sender: CommandSender, command: Command, label: String, args: Array<out String>): Boolean {
        // Check if command sender is a player
        if (sender !is Player) {
            sender.sendMessage("This command can only be used by players")
            return true
        }

        // Check if the correct number of arguments is provided
        if (args.isEmpty()) {
            sender.sendMessage("§cUsage: /soltrade <amount_of_diamonds>")
            return false
        }

        // Parse the amount argument
        val amount: Int = try {
            args[0].toInt()
        } catch (e: NumberFormatException) {
            sender.sendMessage("§cInvalid amount. Please provide a valid number.")
            return false
        }

        // Validate amount
        if (amount <= 0) {
            sender.sendMessage("§cAmount must be greater than 0.")
            return false
        }

        // 1. Check if player has the requested amount of diamonds
        val diamondCount = countDiamonds(sender)
        if (diamondCount < amount) {
            sender.sendMessage("§cYou don't have enough diamonds. You have $diamondCount diamonds.")
            return false
        }

        // 2. Remove diamonds from player's inventory
        val diamondsRemoved = removeDiamonds(sender, amount)
        if (diamondsRemoved != amount) {
            sender.sendMessage("§cError removing diamonds from inventory.")
            return false
        }

        sender.sendMessage("§6Trading $amount diamonds for tokens... Please wait.")

        // 3. Call the mintTokensToPlayer mutation
        val uuid = sender.uniqueId.toString()
        val mutation = """
            mutation {
              mintTokensToPlayer(uuid: "$uuid", amount: $amount) {
                success
                error
                amount
                signature
              }
            }
        """.trimIndent()

        GraphQLService.sendRequest(plugin.backendUrl, mutation, plugin) { success, response ->
            if (success && !response.contains("\"success\":false")) {
                try {
                    // Transaction was successful
                    sender.sendMessage("§aDiamond trade successful! §6$amount §adiamonds exchanged for tokens.")

                    // Get the updated balance
                    checkBalance(sender, plugin)
                } catch (e: Exception) {
                    plugin.logger.warning("Error processing successful mint response: ${e.message}")
                    sender.sendMessage("§eTransaction was processed, but there was an error displaying your new balance.")
                }
            } else {
                // 4. Transaction failed, return diamonds to player
                returnDiamonds(sender, amount)

                // Extract error message if available
                val errorPattern = "\"error\":\"([^\"]+)\"".toRegex()
                val errorMatch = errorPattern.find(response)

                if (errorMatch != null) {
                    val errorMessage = errorMatch.groupValues[1]
                    sender.sendMessage("§cTrade failed: $errorMessage")
                } else {
                    sender.sendMessage("§cTrade failed. Your diamonds have been returned.")
                }

                plugin.logger.warning("Failed to mint tokens for player $uuid: $response")
            }
        }

        return true
    }

    private fun countDiamonds(player: Player): Int {
        var count = 0

        for (item: ItemStack? in player.inventory.contents) {
            if (item != null && item.type == Material.DIAMOND) {
                count += item.amount
            }
        }

        return count
    }

    private fun removeDiamonds(player: Player, amount: Int): Int {
        var remainingToRemove = amount
        val inventory = player.inventory

        // First pass: find all diamonds
        val diamondSlots = mutableListOf<Int>()
        val diamondAmounts = mutableListOf<Int>()

        for (i in 0 until inventory.size) {
            val item = inventory.getItem(i)
            if (item != null && item.type == Material.DIAMOND) {
                diamondSlots.add(i)
                diamondAmounts.add(item.amount)
            }
        }

        // Second pass: remove diamonds
        var removed = 0
        for (i in diamondSlots.indices) {
            val slotIndex = diamondSlots[i]
            val diamondAmount = diamondAmounts[i]

            if (remainingToRemove <= 0) break

            val toRemove = minOf(diamondAmount, remainingToRemove)
            val item = inventory.getItem(slotIndex)

            if (item != null) {
                if (toRemove == item.amount) {
                    inventory.setItem(slotIndex, null)
                } else {
                    item.amount -= toRemove
                }
                remainingToRemove -= toRemove
                removed += toRemove
            }
        }

        return removed
    }

    private fun returnDiamonds(player: Player, amount: Int) {
        player.inventory.addItem(ItemStack(Material.DIAMOND, amount))
        player.sendMessage("§e$amount diamonds have been returned to your inventory.")
    }

    private fun checkBalance(player: Player, plugin: SolcraftPlugin) {
        val uuid = player.uniqueId.toString()

        val query = """
            query {
              playerTokenBalance(uuid: "$uuid") {
                balance
                success
              }
            }
        """.trimIndent()

        GraphQLService.sendRequest(plugin.backendUrl, query, plugin) { success, response ->
            if (success && !response.contains("\"success\":false")) {
                try {
                    // Extract the balance from the response
                    val balancePattern = "\"balance\":([\\d.]+)".toRegex()
                    val balanceMatch = balancePattern.find(response)

                    if (balanceMatch != null) {
                        val balance = balanceMatch.groupValues[1].toDoubleOrNull() ?: 0.0

                        // Format the balance nicely
                        val formattedBalance = if (balance == balance.toInt().toDouble()) {
                            balance.toInt().toString()
                        } else {
                            "%.2f".format(balance)
                        }

                        player.sendMessage("§aYour new token balance: §6$formattedBalance")
                    }
                } catch (e: Exception) {
                    plugin.logger.warning("Error extracting balance from response: ${e.message}")
                }
            }
        }
    }
}