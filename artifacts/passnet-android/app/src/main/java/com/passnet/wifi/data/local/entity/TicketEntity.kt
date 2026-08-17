package com.passnet.wifi.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.passnet.wifi.domain.model.Ticket
import java.time.Instant

@Entity(tableName = "tickets")
data class TicketEntity(
    @PrimaryKey val id: String,
    val username: String,
    val password: String,
    val planId: String,
    val planName: String,
    val durationLabel: String,
    val price: Double,
    val limitUptime: String,
    val rateLimit: String,
    val createdAtEpoch: Long,   // Instant.epochSecond
    val expiresAtEpoch: Long,
    val mikrotikUserId: String?,
) {
    fun toDomain() = Ticket(
        id            = id,
        username      = username,
        password      = password,
        planId        = planId,
        planName      = planName,
        durationLabel = durationLabel,
        price         = price,
        limitUptime   = limitUptime,
        rateLimit     = rateLimit,
        createdAt     = Instant.ofEpochSecond(createdAtEpoch),
        expiresAt     = Instant.ofEpochSecond(expiresAtEpoch),
        mikrotikUserId = mikrotikUserId,
    )

    companion object {
        fun fromDomain(t: Ticket) = TicketEntity(
            id             = t.id,
            username       = t.username,
            password       = t.password,
            planId         = t.planId,
            planName       = t.planName,
            durationLabel  = t.durationLabel,
            price          = t.price,
            limitUptime    = t.limitUptime,
            rateLimit      = t.rateLimit,
            createdAtEpoch = t.createdAt.epochSecond,
            expiresAtEpoch = t.expiresAt.epochSecond,
            mikrotikUserId = t.mikrotikUserId,
        )
    }
}
