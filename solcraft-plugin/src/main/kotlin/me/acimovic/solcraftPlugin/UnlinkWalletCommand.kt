package me.acimovic.solcraftPlugin

import me.acimovic.solcraftPlugin.SolcraftPlugin
import org.bukkit.command.Command
import org.bukkit.command.CommandExecutor
import org.bukkit.command.CommandSender
import org.bukkit.entity.Player

/**
 * Command that allows players to unlink their wallet from their account
 * Usage: /unlinkwallet
 */
class UnlinkWalletCommand(private val plugin: SolcraftPlugin) : CommandExecutor {
    override fun onCommand(sender: CommandSender, command: Command, label: String, args: Array<out String>): Boolean {
        // Check if command sender is a player
        if (sender !is Player) {
            sender.sendMessage("§cThis command can only be used by players")
            return true
        }

        // Notify player that the unlinking process has started
        sender.sendMessage("§6Unlinking wallet... Please wait.")

        // Call the unlinking process and handle the result
        unlinkPlayerWallet(sender)

        return true
    }

    /**
     * Initiates the wallet unlinking process for a player
     *
     * @param player The player who wants to unlink their wallet
     */
    private fun unlinkPlayerWallet(player: Player) {
        plugin.unlinkWallet(player) { success, message ->
            // Apply color formatting based on success status
            val formattedMessage = if (success) {
                "§a$message"
            } else {
                "§c$message"
            }

            player.sendMessage(formattedMessage)
        }
    }
}