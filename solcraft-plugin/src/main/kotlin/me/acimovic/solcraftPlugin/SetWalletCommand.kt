package me.acimovic.solcraftPlugin

import me.acimovic.solcraftPlugin.SolcraftPlugin
import org.bukkit.command.Command
import org.bukkit.command.CommandExecutor
import org.bukkit.command.CommandSender
import org.bukkit.entity.Player

/**
 * Command that allows players to link a wallet address to their account
 * Usage: /setwallet <wallet-address>
 */
class SetWalletCommand(private val plugin: SolcraftPlugin) : CommandExecutor {
    override fun onCommand(sender: CommandSender, command: Command, label: String, args: Array<out String>): Boolean {
        // Check if command sender is a player
        if (sender !is Player) {
            sender.sendMessage("§cThis command can only be used by players")
            return true
        }

        // Validate command arguments
        if (args.size != 1) {
            sender.sendMessage("§cUsage: §6/setwallet <wallet-address>")
            return true
        }

        // Get the wallet address from arguments
        val walletAddress = args[0]

        // Validate wallet address format (basic check)
        if (!isValidWalletFormat(walletAddress)) {
            sender.sendMessage("§cInvalid wallet address format. Please check and try again.")
            return true
        }

        // Notify player that the linking process has started
        sender.sendMessage("§6Setting wallet... Please wait.")

        // Process the wallet linking
        linkPlayerWallet(sender, walletAddress)

        return true
    }

    /**
     * Performs a basic validation of wallet address format
     *
     * @param address The wallet address to validate
     * @return True if the format appears valid, false otherwise
     */
    private fun isValidWalletFormat(address: String): Boolean {
        // Basic validation for Solana wallet addresses
        // Most Solana addresses are 44 characters long and start with a specific pattern
        // This is a simple check and can be expanded for more thorough validation
        return address.length >= 32 && address.length <= 48
    }

    /**
     * Initiates the wallet linking process for a player
     *
     * @param player The player who wants to link their wallet
     * @param walletAddress The wallet address to link to the player's account
     */
    private fun linkPlayerWallet(player: Player, walletAddress: String) {
        plugin.linkWallet(player, walletAddress) { success, message ->
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