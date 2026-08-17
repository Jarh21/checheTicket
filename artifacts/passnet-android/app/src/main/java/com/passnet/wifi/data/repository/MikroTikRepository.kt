package com.passnet.wifi.data.repository

import android.util.Base64
import com.passnet.wifi.data.local.SecureStorage
import com.passnet.wifi.data.remote.mikrotik.MikroTikClient
import com.passnet.wifi.data.remote.mikrotik.MikroTikResult
import com.passnet.wifi.domain.model.MikroTikConfig
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MikroTikRepository @Inject constructor(
    private val client: MikroTikClient,
    private val storage: SecureStorage,
) {
    fun loadConfig(): MikroTikConfig = MikroTikConfig(
        ip            = storage.getMikroTikIp(),
        user          = storage.getMikroTikUser(),
        password      = storage.getMikroTikPassword(),
        hotspotServer = storage.getMikroTikHotspot(),
        wifiName      = storage.getMikroTikWifiName(),
    )

    fun saveConfig(config: MikroTikConfig) {
        storage.saveMikroTikConfig(
            ip           = config.ip,
            user         = config.user,
            password     = config.password,
            hotspotServer = config.hotspotServer,
            wifiName     = config.wifiName,
        )
    }

    suspend fun testConnection(config: MikroTikConfig): Result<String> {
        return when (val result = client.testConnection(config)) {
            is MikroTikResult.Success -> Result.success("Conexión exitosa con MikroTik")
            is MikroTikResult.Error   -> Result.failure(Exception(result.message))
        }
    }

    /** Upload a custom hotspot portal HTML page to the router. */
    suspend fun uploadPortal(config: MikroTikConfig, html: String): Result<Unit> {
        val base64Content = Base64.encodeToString(html.toByteArray(Charsets.US_ASCII), Base64.NO_WRAP)
        val candidateNames = listOf("flash/hotspot/login.html", "hotspot/login.html")

        val filesResult = client.listFiles(config)
        if (filesResult is MikroTikResult.Error) {
            return Result.failure(Exception("No se pudieron listar archivos del router: ${filesResult.message}"))
        }

        val files = (filesResult as MikroTikResult.Success).data
        val existing = files.find { it.name in candidateNames }

        return if (existing != null) {
            when (val r = client.updateFile(config, existing.id, base64Content)) {
                is MikroTikResult.Success -> Result.success(Unit)
                is MikroTikResult.Error   -> Result.failure(Exception("Error al actualizar el archivo: ${r.message}"))
            }
        } else {
            when (val r = client.createFile(config, "flash/hotspot/login.html", base64Content)) {
                is MikroTikResult.Success -> Result.success(Unit)
                is MikroTikResult.Error   -> Result.failure(Exception("Error al crear el archivo: ${r.message}"))
            }
        }
    }
}
