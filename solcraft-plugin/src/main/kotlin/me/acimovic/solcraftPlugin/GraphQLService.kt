package me.acimovic.solcraftPlugin

import org.bukkit.Bukkit
import org.bukkit.plugin.java.JavaPlugin
import java.io.BufferedOutputStream
import java.io.ByteArrayOutputStream
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL

/**
 * Service for making GraphQL API requests
 */
object GraphQLService {
    /**
     * Sends a GraphQL request to the specified URL
     *
     * @param url The endpoint URL for the GraphQL API
     * @param query The GraphQL query to send
     * @param plugin The plugin instance for scheduling tasks
     * @param callback Function to handle the response (success flag, response body)
     */
    fun sendRequest(url: String, query: String, plugin: JavaPlugin, callback: (Boolean, String) -> Unit) {
        // Run the HTTP request in an async task to avoid blocking the main server thread
        Bukkit.getScheduler().runTaskAsynchronously(plugin, Runnable {
            var connection: HttpURLConnection? = null

            try {
                // Create and configure the connection
                connection = createConnection(url)

                // Send the request with the GraphQL query
                sendGraphQLQuery(connection, query)

                // Process the response
                handleResponse(connection, plugin, callback)

            } catch (e: Exception) {
                // Log and handle any exceptions
                logError(e, plugin)
                returnErrorToCallback(e, plugin, callback)

            } finally {
                // Always close the connection
                connection?.disconnect()
            }
        })
    }

    /**
     * Creates and configures an HTTP connection
     */
    private fun createConnection(url: String): HttpURLConnection {
        val urlObj = URL(url)
        val connection = urlObj.openConnection() as HttpURLConnection

        // Configure for a POST request with JSON content
        connection.requestMethod = "POST"
        connection.setRequestProperty("Content-Type", "application/json")
        connection.doOutput = true
        connection.doInput = true
        connection.useCaches = false

        return connection
    }

    /**
     * Sends the GraphQL query in the request body
     */
    private fun sendGraphQLQuery(connection: HttpURLConnection, query: String) {
        // Format the query as a JSON request
        val escapedQuery = query.replace("\n", " ").replace("\"", "\\\"")
        val requestBody = "{\"query\": \"$escapedQuery\"}"

        // Write the request body to the connection
        BufferedOutputStream(connection.outputStream).use { outputStream ->
            outputStream.write(requestBody.toByteArray())
            outputStream.flush()
        }
    }

    /**
     * Handles the HTTP response
     */
    private fun handleResponse(
        connection: HttpURLConnection,
        plugin: JavaPlugin,
        callback: (Boolean, String) -> Unit
    ) {
        val responseCode = connection.responseCode

        // Read the appropriate stream based on success or error
        val responseBody = if (responseCode < 400) {
            readStream(connection.inputStream)
        } else {
            val errorStream = connection.errorStream
            if (errorStream != null) {
                readStream(errorStream)
            } else {
                "Error: HTTP $responseCode with no response body"
            }
        }

        // Return to the main thread to execute the callback
        Bukkit.getScheduler().runTask(plugin, Runnable {
            if (responseCode < 400) {
                callback(true, responseBody)
            } else {
                callback(false, "HTTP Error $responseCode: $responseBody")
            }
        })
    }

    /**
     * Logs an exception that occurred during the request
     */
    private fun logError(e: Exception, plugin: JavaPlugin) {
        plugin.logger.severe("Error in GraphQL request: ${e.javaClass.name}: ${e.message}")
        e.printStackTrace()
    }

    /**
     * Returns an error to the callback on the main thread
     */
    private fun returnErrorToCallback(
        e: Exception,
        plugin: JavaPlugin,
        callback: (Boolean, String) -> Unit
    ) {
        Bukkit.getScheduler().runTask(plugin, Runnable {
            callback(false, "Error: ${e.javaClass.simpleName}: ${e.message ?: "Unknown error"}")
        })
    }

    /**
     * Reads an input stream into a string
     */
    private fun readStream(inputStream: InputStream): String {
        val result = ByteArrayOutputStream()
        val buffer = ByteArray(1024)
        var length: Int

        while (inputStream.read(buffer).also { length = it } != -1) {
            result.write(buffer, 0, length)
        }

        return result.toString("UTF-8")
    }
}