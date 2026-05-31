package com.skipq.app.data

import kotlinx.serialization.Serializable

/**
 * SkipQ Live Ticket State Data Model
 * Tracks a customer's active token number, people ahead, estimated wait time,
 * priority tagging, and regional Gemini-triage advice.
 */
@Serializable
data class TicketState(
    val tokenId: String = "",
    val tokenNumber: String = "",
    val visitorName: String = "",
    val peopleAhead: Int = 0,
    val estimatedWaitMinutes: Int = 0,
    val status: String = "waiting", // "waiting", "serving", "benched", "completed", "cancelled"
    val queueType: String = "main", // "main", "buffer"
    val language: String = "English",
    val aiAdvice: String = "",
    val connectionStatus: String = "Connecting..."
)
