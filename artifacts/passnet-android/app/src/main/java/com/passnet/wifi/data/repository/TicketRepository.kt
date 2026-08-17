package com.passnet.wifi.data.repository

import com.passnet.wifi.data.local.dao.TicketDao
import com.passnet.wifi.data.local.entity.TicketEntity
import com.passnet.wifi.data.remote.mikrotik.MikroTikClient
import com.passnet.wifi.data.remote.mikrotik.MikroTikResult
import com.passnet.wifi.data.remote.mikrotik.dto.CreateUserRequest
import com.passnet.wifi.domain.model.MikroTikConfig
import com.passnet.wifi.domain.model.Plan
import com.passnet.wifi.domain.model.Ticket
import com.passnet.wifi.domain.model.generateTicketPassword
import com.passnet.wifi.domain.model.generateUsername
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TicketRepository @Inject constructor(
    private val dao: TicketDao,
    private val mikrotik: MikroTikClient,
    private val planRepository: PlanRepository,
) {
    fun observeTickets(): Flow<List<Ticket>> =
        dao.observeAll().map { list -> list.map { it.toDomain() } }

    suspend fun getAll(): List<Ticket> = dao.getAll().map { it.toDomain() }

    /** Generate a ticket: syncs the profile, creates the RouterOS user, then persists locally.
     *  Returns the created ticket or an error message. */
    suspend fun generateTicket(
        config: MikroTikConfig,
        plan: Plan,
    ): Result<Ticket> {
        // 1. Sync profile
        val syncError = planRepository.syncProfile(config, plan)
        if (syncError != null) return Result.failure(Exception("No se pudo configurar la velocidad del plan: $syncError"))

        // 2. Generate credentials
        val username = generateUsername()
        val password = generateTicketPassword()

        // 3. Create RouterOS user
        val createResult = mikrotik.createUser(
            config,
            CreateUserRequest(
                name        = username,
                password    = password,
                profile     = plan.profileName,
                limitUptime = plan.limitUptime,
            )
        )
        if (createResult is MikroTikResult.Error) {
            return Result.failure(Exception(createResult.message))
        }

        val mikrotikUser = (createResult as MikroTikResult.Success).data

        // 4. Calculate expiry
        val now = Instant.now()
        val expiresAt = when (plan.type) {
            com.passnet.wifi.domain.model.PlanType.HOURS ->
                now.plusSeconds(plan.duration * 3600L)
            com.passnet.wifi.domain.model.PlanType.DAYS  ->
                now.plusSeconds(plan.duration * 86400L)
        }

        // 5. Persist locally
        val ticket = Ticket(
            username       = username,
            password       = password,
            planId         = plan.id,
            planName       = plan.name,
            durationLabel  = plan.durationLabel,
            price          = plan.price,
            limitUptime    = plan.limitUptime,
            rateLimit      = plan.rateLimit,
            createdAt      = now,
            expiresAt      = expiresAt,
            mikrotikUserId = mikrotikUser.id.ifBlank { null },
        )
        dao.insert(TicketEntity.fromDomain(ticket))
        return Result.success(ticket)
    }

    /** Delete a ticket: removes the RouterOS user, then the local record on success. */
    suspend fun deleteTicket(config: MikroTikConfig, ticket: Ticket): String? {
        // Find the RouterOS ID
        val targetId: String? = when {
            !ticket.mikrotikUserId.isNullOrBlank() -> ticket.mikrotikUserId
            else -> {
                val found = mikrotik.findUserByName(config, ticket.username)
                if (found is MikroTikResult.Error) return found.message
                (found as MikroTikResult.Success).data?.id
            }
        }

        if (!targetId.isNullOrBlank()) {
            val result = mikrotik.deleteUser(config, targetId)
            // 404 = already absent = success; any other error → abort
            if (result is MikroTikResult.Error && result.code != 404) {
                return result.message
            }
        }

        dao.deleteById(ticket.id)
        return null // success
    }

    suspend fun deleteLocalOnly(ticketId: String) = dao.deleteById(ticketId)

    suspend fun deleteExpired() {
        dao.deleteExpiredBefore(Instant.now().epochSecond)
    }

    suspend fun countTodayTickets(): Int {
        val startOfDay = LocalDate.now(ZoneId.systemDefault())
            .atStartOfDay(ZoneId.systemDefault())
            .toInstant()
            .epochSecond
        return dao.countCreatedSince(startOfDay)
    }
}
