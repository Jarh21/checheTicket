package com.passnet.wifi.data.remote.license.dto

import com.google.gson.annotations.SerializedName

// ── Requests ──────────────────────────────────────────────────────────────────

data class LoginRequest(
    val email: String,
    val password: String,
    @SerializedName("deviceId") val deviceId: String,
    @SerializedName("deviceName") val deviceName: String,
)

data class ForgotPasswordRequest(val email: String)

data class ResetPasswordRequest(val token: String, val password: String)

// ── Nested DTOs ───────────────────────────────────────────────────────────────

data class AccountDto(
    val id: String,
    val email: String,
    val name: String,
)

data class LicenseDto(
    val id: String,
    val status: String,
    @SerializedName("expiresAt") val expiresAt: String,
    @SerializedName("maxDevices") val maxDevices: Int = 1,
)

data class SessionDto(
    val account: AccountDto,
    val license: LicenseDto,
)

// ── Responses ─────────────────────────────────────────────────────────────────

data class LoginResponse(
    val token: String,
    val session: SessionDto,
)

data class SessionResponse(
    val account: AccountDto,
    val license: LicenseDto,
)

data class MessageResponse(val message: String)
