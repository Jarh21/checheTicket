package com.passnet.wifi.domain.model

import java.time.Instant
import java.util.UUID

data class Ticket(
    val id: String = UUID.randomUUID().toString(),
    val username: String,
    val password: String,
    val planId: String,
    val planName: String,
    val durationLabel: String,
    val price: Double,
    val limitUptime: String,
    val rateLimit: String,
    val createdAt: Instant = Instant.now(),
    val expiresAt: Instant,
    val mikrotikUserId: String? = null,
) {
    val isExpired: Boolean get() = Instant.now().isAfter(expiresAt)
}

/** Generate a random hotspot username: "h" + 6 lowercase alphanumeric chars */
fun generateUsername(): String {
    val chars = "abcdefghijklmnopqrstuvwxyz0123456789"
    return "h" + (1..6).map { chars.random() }.joinToString("")
}

/** Generate a 6-char password avoiding ambiguous characters (l, o, 0, 1, I) */
fun generateTicketPassword(): String {
    val chars = "abcdefghjkmnpqrstuvwxyz23456789"
    return (1..6).map { chars.random() }.joinToString("")
}
