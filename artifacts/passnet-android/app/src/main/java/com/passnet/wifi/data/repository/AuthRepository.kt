package com.passnet.wifi.data.repository

import com.passnet.wifi.data.local.SecureStorage
import com.passnet.wifi.data.remote.license.LicenseApi
import com.passnet.wifi.data.remote.license.dto.ForgotPasswordRequest
import com.passnet.wifi.data.remote.license.dto.LoginRequest
import com.passnet.wifi.data.remote.license.dto.ResetPasswordRequest
import com.passnet.wifi.domain.model.LicenseSession
import javax.inject.Inject
import javax.inject.Singleton

sealed class AuthResult<out T> {
    data class Success<T>(val data: T) : AuthResult<T>()
    data class Error(val message: String) : AuthResult<Nothing>()
}

@Singleton
class AuthRepository @Inject constructor(
    private val api: LicenseApi,
    private val storage: SecureStorage,
) {
    suspend fun login(email: String, password: String): AuthResult<LicenseSession> = try {
        val deviceId = storage.getOrCreateDeviceId()
        val response = api.login(
            LoginRequest(
                email      = email.trim().lowercase(),
                password   = password,
                deviceId   = deviceId,
                deviceName = "Android",
            )
        )
        storage.saveToken(response.token)
        AuthResult.Success(response.session.toDomain(response.token))
    } catch (e: retrofit2.HttpException) {
        val msg = when (e.code()) {
            401  -> "Correo o contraseña incorrectos"
            403  -> "Licencia inactiva o dispositivo no autorizado"
            else -> "Error del servidor (${e.code()})"
        }
        AuthResult.Error(msg)
    } catch (e: java.io.IOException) {
        AuthResult.Error("Sin conexión con el servidor de licencias")
    } catch (e: Exception) {
        AuthResult.Error(e.message ?: "Error desconocido")
    }

    suspend fun restoreSession(): AuthResult<LicenseSession> {
        val token = storage.getToken() ?: return AuthResult.Error("Sin sesión guardada")
        return try {
            val response = api.getSession()
            AuthResult.Success(response.toDomain(token))
        } catch (e: retrofit2.HttpException) {
            when (e.code()) {
                401, 403 -> {
                    storage.clearToken()
                    AuthResult.Error("Sesión expirada")
                }
                else -> AuthResult.Error("Error del servidor (${e.code()})")
            }
        } catch (e: java.io.IOException) {
            // Network error: preserve token, don't invalidate session
            AuthResult.Error("Sin conexión — intento de restaurar sesión fallido")
        }
    }

    suspend fun logout(): AuthResult<Unit> = try {
        if (storage.getToken() != null) {
            api.logout()
        }
        storage.clearToken()
        AuthResult.Success(Unit)
    } catch (e: Exception) {
        storage.clearToken()
        AuthResult.Success(Unit) // Always clear locally even if server fails
    }

    suspend fun forgotPassword(email: String): AuthResult<String> = try {
        val response = api.forgotPassword(ForgotPasswordRequest(email.trim().lowercase()))
        AuthResult.Success(response.message)
    } catch (e: retrofit2.HttpException) {
        AuthResult.Error("Error del servidor (${e.code()})")
    } catch (e: java.io.IOException) {
        AuthResult.Error("Sin conexión con el servidor")
    }

    suspend fun resetPassword(token: String, password: String): AuthResult<String> = try {
        val response = api.resetPassword(ResetPasswordRequest(token, password))
        AuthResult.Success(response.message)
    } catch (e: retrofit2.HttpException) {
        AuthResult.Error(if (e.code() == 400) "Token inválido o expirado" else "Error del servidor (${e.code()})")
    } catch (e: java.io.IOException) {
        AuthResult.Error("Sin conexión con el servidor")
    }

    fun hasToken(): Boolean = storage.getToken() != null
}

// ── DTO → Domain mappers ──────────────────────────────────────────────────────
private fun com.passnet.wifi.data.remote.license.dto.SessionDto.toDomain(token: String) =
    LicenseSession(
        token        = token,
        accountId    = account.id,
        accountEmail = account.email,
        accountName  = account.name,
        licenseId    = license.id,
        licenseStatus = license.status,
        expiresAt    = license.expiresAt,
        maxDevices   = license.maxDevices,
    )

private fun com.passnet.wifi.data.remote.license.dto.SessionResponse.toDomain(token: String) =
    LicenseSession(
        token        = token,
        accountId    = account.id,
        accountEmail = account.email,
        accountName  = account.name,
        licenseId    = license.id,
        licenseStatus = license.status,
        expiresAt    = license.expiresAt,
        maxDevices   = license.maxDevices,
    )
