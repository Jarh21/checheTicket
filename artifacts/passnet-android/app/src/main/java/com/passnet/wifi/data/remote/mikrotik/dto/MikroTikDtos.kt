package com.passnet.wifi.data.remote.mikrotik.dto

import com.google.gson.annotations.SerializedName

data class MikroTikUserProfile(
    @SerializedName(".id")         val id: String = "",
    val name: String               = "",
    @SerializedName("rate-limit") val rateLimit: String? = null,
)

data class CreateProfileRequest(
    val name: String,
    @SerializedName("rate-limit") val rateLimit: String,
)

data class UpdateProfileRequest(
    @SerializedName("rate-limit") val rateLimit: String,
)

data class MikroTikUser(
    @SerializedName(".id")           val id: String = "",
    val name: String                 = "",
    val password: String             = "",
    val profile: String?             = null,
    @SerializedName("limit-uptime") val limitUptime: String? = null,
)

data class CreateUserRequest(
    val name: String,
    val password: String,
    val profile: String,
    @SerializedName("limit-uptime") val limitUptime: String,
)

data class MikroTikFile(
    @SerializedName(".id") val id: String,
    val name: String,
)

data class UpdateFileRequest(val contents: String)
data class CreateFileRequest(val name: String, val contents: String)

data class MikroTikHotspot(
    @SerializedName(".id") val id: String = "",
    val name: String = "",
)
