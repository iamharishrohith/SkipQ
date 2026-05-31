package com.skipq.app.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.skipq.app.data.TicketState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import io.ktor.client.*
import io.ktor.client.engine.cio.*
import io.ktor.client.plugins.websocket.*
import io.ktor.websocket.*
import kotlinx.coroutines.isActive
import kotlinx.coroutines.delay
import kotlinx.serialization.json.Json

/**
 * SkipQ Queue State ViewModel
 * Handles Ktor native Android WebSocket connection streaming to Elysia.
 * Publishes reactive StateFlow to update Compose views instantly on queue advance.
 */
class QueueViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(TicketState())
    val uiState: StateFlow<TicketState> = _uiState.asStateFlow()

    private val client = HttpClient(CIO) {
        install(WebSockets)
    }

    /**
     * Connects to local server WebSocket to listen to queue updates live.
     * Retries automatically on network dropouts.
     */
    fun listenToLiveQueue(apiUrl: String, tokenId: String) {
        viewModelScope.launch {
            val formattedWsUrl = apiUrl
                .replace("http://", "ws://")
                .replace("https://", "wss://") + "/ws/queue"

            while (isActive) {
                try {
                    _uiState.value = _uiState.value.copy(connectionStatus = "Syncing...")
                    
                    client.webSocket(formattedWsUrl) {
                        _uiState.value = _uiState.value.copy(connectionStatus = "Live Sync Active")
                        
                        // Handshake/subscribe payload
                        send(Frame.Text("""{"type":"SUBSCRIBE","tokenId":"$tokenId"}"""))

                        // Listen to frames
                        for (frame in incoming) {
                            if (frame is Frame.Text) {
                                val text = frame.readText()
                                try {
                                    val state = Json.decodeFromString<TicketState>(text)
                                    _uiState.value = state.copy(connectionStatus = "Live Sync Active")
                                } catch (e: Exception) {
                                    println("⚠️ Error parsing frame: ${e.message}")
                                }
                            }
                        }
                    }
                } catch (e: Exception) {
                    println("⚠️ WebSocket connection failed: ${e.message}, retrying in 3s...")
                    _uiState.value = _uiState.value.copy(connectionStatus = "Disconnected (Retrying)")
                    delay(3000)
                }
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        client.close()
    }
}
