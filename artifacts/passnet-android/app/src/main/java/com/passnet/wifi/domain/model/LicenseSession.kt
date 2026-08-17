package com.passnet.wifi.domain.model

data class LicenseSession(
    val token: String,
    val accountId: String,
    val accountEmail: String,
    val accountName: String,
    val licenseId: String,
    val licenseStatus: String,   // "active" | "expired" | "suspended"
    val expiresAt: String,       // ISO-8601 string from server
    val maxDevices: Int,
)

sealed class AuthState {
    object Loading : AuthState()
    object Unauthenticated : AuthState()
    data class Authenticated(val session: LicenseSession) : AuthState()
}
