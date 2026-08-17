package com.passnet.wifi.data.repository

import com.passnet.wifi.data.local.dao.PlanDao
import com.passnet.wifi.data.local.entity.PlanEntity
import com.passnet.wifi.data.remote.mikrotik.MikroTikClient
import com.passnet.wifi.data.remote.mikrotik.MikroTikResult
import com.passnet.wifi.data.remote.mikrotik.dto.CreateProfileRequest
import com.passnet.wifi.data.remote.mikrotik.dto.UpdateProfileRequest
import com.passnet.wifi.domain.model.MikroTikConfig
import com.passnet.wifi.domain.model.Plan
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PlanRepository @Inject constructor(
    private val dao: PlanDao,
    private val mikrotik: MikroTikClient,
) {
    fun observePlans(): Flow<List<Plan>> =
        dao.observeAll().map { list -> list.map { it.toDomain() } }

    suspend fun getAll(): List<Plan> = dao.getAll().map { it.toDomain() }

    suspend fun getById(id: String): Plan? = dao.getById(id)?.toDomain()

    suspend fun save(plan: Plan) = dao.upsert(PlanEntity.fromDomain(plan))

    suspend fun delete(plan: Plan) {
        dao.deleteById(plan.id)
    }

    /** Ensure the RouterOS profile exists and matches the plan's rate limit.
     *  Returns an error message or null on success. */
    suspend fun syncProfile(config: MikroTikConfig, plan: Plan): String? {
        val profilesResult = mikrotik.listProfiles(config)
        if (profilesResult is MikroTikResult.Error) return profilesResult.message

        val profiles = (profilesResult as MikroTikResult.Success).data
        val existing = profiles.find { it.name == plan.profileName }

        if (existing != null) {
            if (existing.rateLimit != plan.rateLimit) {
                val update = mikrotik.updateProfile(
                    config, existing.id, UpdateProfileRequest(plan.rateLimit)
                )
                if (update is MikroTikResult.Error) return update.message
            }
        } else {
            val create = mikrotik.createProfile(
                config, CreateProfileRequest(plan.profileName, plan.rateLimit)
            )
            if (create is MikroTikResult.Error) return create.message
        }

        dao.updateSynced(plan.id, true)
        return null // success
    }
}
