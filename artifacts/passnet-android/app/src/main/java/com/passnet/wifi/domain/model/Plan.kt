package com.passnet.wifi.domain.model

import java.util.UUID

enum class PlanType { HOURS, DAYS }

data class Plan(
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val type: PlanType,
    val duration: Int,
    val price: Double,
    val uploadSpeed: Int,   // Mbps
    val downloadSpeed: Int, // Mbps
    val mikrotikProfile: String? = null,
    val synced: Boolean = false,
) {
    /** Rate-limit string for RouterOS: "downloadM/uploadM" */
    val rateLimit: String get() = "${downloadSpeed}M/${uploadSpeed}M"

    /** limit-uptime string for RouterOS */
    val limitUptime: String get() = when (type) {
        PlanType.HOURS -> "%02d:00:00".format(duration)
        PlanType.DAYS  -> "${duration}d 00:00:00"
    }

    /** Human-readable label */
    val durationLabel: String get() = when (type) {
        PlanType.HOURS -> if (duration == 1) "1 Hora" else "$duration Horas"
        PlanType.DAYS  -> if (duration == 1) "1 Día"  else "$duration Días"
    }

    /** Stable profile name derived from the plan id (FNV-1a hash) */
    val profileName: String get() = mikrotikProfile ?: run {
        var hash = 2166136261L
        for (ch in id) {
            hash = hash xor ch.code.toLong()
            hash = (hash * 16777619L) and 0xFFFFFFFFL
        }
        "app-plan-${hash.toString(36)}"
    }
}
