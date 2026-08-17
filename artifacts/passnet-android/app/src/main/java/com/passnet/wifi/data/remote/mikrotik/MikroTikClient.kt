package com.passnet.wifi.data.remote.mikrotik

import android.util.Base64
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.passnet.wifi.data.remote.mikrotik.dto.*
import com.passnet.wifi.domain.model.MikroTikConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

sealed class MikroTikResult<out T> {
    data class Success<T>(val data: T) : MikroTikResult<T>()
    data class Error(val message: String, val code: Int = -1) : MikroTikResult<Nothing>()
}

@Singleton
class MikroTikClient @Inject constructor() {

    private val gson = Gson()
    private val json = "application/json; charset=utf-8".toMediaType()

    private fun buildClient(timeoutSeconds: Long = 8): OkHttpClient =
        OkHttpClient.Builder()
            .connectTimeout(timeoutSeconds, TimeUnit.SECONDS)
            .readTimeout(timeoutSeconds, TimeUnit.SECONDS)
            .writeTimeout(timeoutSeconds, TimeUnit.SECONDS)
            .build()

    private fun authHeader(config: MikroTikConfig): String {
        val credentials = "${config.user}:${config.password}"
        val encoded = Base64.encodeToString(credentials.toByteArray(Charsets.UTF_8), Base64.NO_WRAP)
        return "Basic $encoded"
    }

    private suspend inline fun <reified T> get(
        config: MikroTikConfig,
        path: String,
        timeoutSeconds: Long = 8,
    ): MikroTikResult<T> = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder()
                .url("${config.baseUrl}/$path")
                .header("Authorization", authHeader(config))
                .header("Content-Type", "application/json")
                .get()
                .build()
            val response = buildClient(timeoutSeconds).newCall(request).execute()
            val body = response.body?.string() ?: ""
            if (response.isSuccessful) {
                val type = object : TypeToken<T>() {}.type
                MikroTikResult.Success(gson.fromJson(body, type))
            } else {
                MikroTikResult.Error(mapHttpError(response.code, body), response.code)
            }
        } catch (e: java.net.SocketTimeoutException) {
            MikroTikResult.Error("Tiempo agotado — verifica la IP y que estés en la red del router")
        } catch (e: Exception) {
            MikroTikResult.Error(e.message ?: "Error de conexión")
        }
    }

    private suspend fun put(
        config: MikroTikConfig,
        path: String,
        body: Any,
        timeoutSeconds: Long = 10,
    ): MikroTikResult<String> = withContext(Dispatchers.IO) {
        try {
            val requestBody = gson.toJson(body).toRequestBody(json)
            val request = Request.Builder()
                .url("${config.baseUrl}/$path")
                .header("Authorization", authHeader(config))
                .put(requestBody)
                .build()
            val response = buildClient(timeoutSeconds).newCall(request).execute()
            val bodyStr = response.body?.string() ?: ""
            if (response.isSuccessful) MikroTikResult.Success(bodyStr)
            else MikroTikResult.Error(mapHttpError(response.code, bodyStr), response.code)
        } catch (e: java.net.SocketTimeoutException) {
            MikroTikResult.Error("Tiempo agotado")
        } catch (e: Exception) {
            MikroTikResult.Error(e.message ?: "Error de conexión")
        }
    }

    private suspend fun patch(
        config: MikroTikConfig,
        path: String,
        body: Any,
        timeoutSeconds: Long = 10,
    ): MikroTikResult<String> = withContext(Dispatchers.IO) {
        try {
            val requestBody = gson.toJson(body).toRequestBody(json)
            val request = Request.Builder()
                .url("${config.baseUrl}/$path")
                .header("Authorization", authHeader(config))
                .patch(requestBody)
                .build()
            val response = buildClient(timeoutSeconds).newCall(request).execute()
            val bodyStr = response.body?.string() ?: ""
            if (response.isSuccessful) MikroTikResult.Success(bodyStr)
            else MikroTikResult.Error(mapHttpError(response.code, bodyStr), response.code)
        } catch (e: java.net.SocketTimeoutException) {
            MikroTikResult.Error("Tiempo agotado")
        } catch (e: Exception) {
            MikroTikResult.Error(e.message ?: "Error de conexión")
        }
    }

    private suspend fun delete(
        config: MikroTikConfig,
        path: String,
    ): MikroTikResult<Unit> = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder()
                .url("${config.baseUrl}/$path")
                .header("Authorization", authHeader(config))
                .delete()
                .build()
            val response = buildClient(6).newCall(request).execute()
            return@withContext if (response.isSuccessful || response.code == 404)
                MikroTikResult.Success(Unit)
            else
                MikroTikResult.Error(mapHttpError(response.code, response.body?.string() ?: ""), response.code)
        } catch (e: java.net.SocketTimeoutException) {
            MikroTikResult.Error("Tiempo agotado al eliminar el usuario")
        } catch (e: Exception) {
            MikroTikResult.Error(e.message ?: "Error al eliminar")
        }
    }

    // ── Public API ─────────────────────────────────────────────────────────────

    suspend fun testConnection(config: MikroTikConfig): MikroTikResult<List<MikroTikHotspot>> =
        get(config, "ip/hotspot", timeoutSeconds = 6)

    suspend fun listProfiles(config: MikroTikConfig): MikroTikResult<List<MikroTikUserProfile>> =
        get(config, "ip/hotspot/user/profile")

    suspend fun createProfile(config: MikroTikConfig, req: CreateProfileRequest): MikroTikResult<String> =
        put(config, "ip/hotspot/user/profile", req)

    suspend fun updateProfile(config: MikroTikConfig, id: String, req: UpdateProfileRequest): MikroTikResult<String> =
        patch(config, "ip/hotspot/user/profile/${encodeId(id)}", req)

    suspend fun listUsers(config: MikroTikConfig): MikroTikResult<List<MikroTikUser>> =
        get(config, "ip/hotspot/user")

    suspend fun createUser(config: MikroTikConfig, req: CreateUserRequest): MikroTikResult<MikroTikUser> =
        withContext(Dispatchers.IO) {
            val requestBody = gson.toJson(req).toRequestBody(json)
            try {
                val request = Request.Builder()
                    .url("${config.baseUrl}/ip/hotspot/user")
                    .header("Authorization", authHeader(config))
                    .put(requestBody)
                    .build()
                val response = buildClient(10).newCall(request).execute()
                val bodyStr = response.body?.string() ?: ""
                if (response.isSuccessful) {
                    MikroTikResult.Success(gson.fromJson(bodyStr, MikroTikUser::class.java))
                } else {
                    MikroTikResult.Error(mapHttpError(response.code, bodyStr), response.code)
                }
            } catch (e: java.net.SocketTimeoutException) {
                MikroTikResult.Error("Tiempo agotado al crear el usuario")
            } catch (e: Exception) {
                MikroTikResult.Error(e.message ?: "Error al crear usuario")
            }
        }

    suspend fun deleteUser(config: MikroTikConfig, userId: String): MikroTikResult<Unit> =
        delete(config, "ip/hotspot/user/${encodeId(userId)}")

    suspend fun findUserByName(config: MikroTikConfig, name: String): MikroTikResult<MikroTikUser?> {
        val result = listUsers(config)
        return when (result) {
            is MikroTikResult.Success -> MikroTikResult.Success(result.data.find { it.name == name })
            is MikroTikResult.Error   -> result
        }
    }

    suspend fun listFiles(config: MikroTikConfig): MikroTikResult<List<MikroTikFile>> =
        get(config, "file")

    suspend fun updateFile(config: MikroTikConfig, fileId: String, contents: String): MikroTikResult<String> =
        patch(config, "file/${encodeId(fileId)}", UpdateFileRequest(contents))

    suspend fun createFile(config: MikroTikConfig, name: String, contents: String): MikroTikResult<String> =
        put(config, "file", CreateFileRequest(name, contents))

    // ── Helpers ────────────────────────────────────────────────────────────────

    /** Preserve the asterisk in RouterOS IDs like "*6" — do NOT percent-encode it. */
    private fun encodeId(id: String): String = id

    private fun mapHttpError(code: Int, body: String): String = when (code) {
        401  -> "Credenciales incorrectas (401)"
        403  -> "Acceso denegado (403)"
        404  -> "Ruta no encontrada — verifica la IP del router (404)"
        else -> "Error HTTP $code: ${body.take(120)}"
    }
}
