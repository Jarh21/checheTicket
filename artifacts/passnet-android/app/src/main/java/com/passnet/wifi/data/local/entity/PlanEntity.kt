package com.passnet.wifi.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.passnet.wifi.domain.model.Plan
import com.passnet.wifi.domain.model.PlanType

@Entity(tableName = "plans")
data class PlanEntity(
    @PrimaryKey val id: String,
    val name: String,
    val type: String,          // "HOURS" | "DAYS"
    val duration: Int,
    val price: Double,
    val uploadSpeed: Int,
    val downloadSpeed: Int,
    val mikrotikProfile: String?,
    val synced: Boolean,
) {
    fun toDomain() = Plan(
        id             = id,
        name           = name,
        type           = PlanType.valueOf(type),
        duration       = duration,
        price          = price,
        uploadSpeed    = uploadSpeed,
        downloadSpeed  = downloadSpeed,
        mikrotikProfile = mikrotikProfile,
        synced         = synced,
    )

    companion object {
        fun fromDomain(plan: Plan) = PlanEntity(
            id             = plan.id,
            name           = plan.name,
            type           = plan.type.name,
            duration       = plan.duration,
            price          = plan.price,
            uploadSpeed    = plan.uploadSpeed,
            downloadSpeed  = plan.downloadSpeed,
            mikrotikProfile = plan.mikrotikProfile,
            synced         = plan.synced,
        )
    }
}
