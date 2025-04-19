package me.acimovic.solcraftPlugin

import org.bukkit.Material
import org.bukkit.command.Command
import org.bukkit.command.CommandExecutor
import org.bukkit.command.CommandSender
import org.bukkit.entity.Player
import org.bukkit.inventory.ItemStack

/**
 * Command that counts diamond items in a player's inventory
 * Usage: /howmany
 */
class HowManyCommand : CommandExecutor {
    override fun onCommand(sender: CommandSender, command: Command, label: String, args: Array<out String>): Boolean {
        // Check if sender is a player
        if (sender !is Player) {
            sender.sendMessage("§cThis command can only be used by players")
            return true
        }

        // Count the diamonds
        val count = countDiamonds(sender)

        // Send the result message
        sender.sendMessage("§aYou have §6$count §adiamonds in your inventory")

        return true
    }

    /**
     * Counts the number of diamonds in a player's inventory
     *
     * @param player The player whose inventory to check
     * @return The total count of diamonds
     */
    private fun countDiamonds(player: Player): Int {
        var count = 0

        // Count diamonds in main inventory
        for (item: ItemStack? in player.inventory.contents) {
            if (item != null && item.type == Material.DIAMOND) {
                count += item.amount
            }
        }

        return count
    }
}