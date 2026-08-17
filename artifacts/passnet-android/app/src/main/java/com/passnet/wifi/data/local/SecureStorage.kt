package com.passnet.wifi.data.local

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.google.gson.Gson
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Encrypted storage for sensitive data: session token, MikroTik credentials,
 * and any other secrets. Uses Android Keystore via EncryptedSharedPreferences.
 *
 * Non-sensitive config (printer selection, portal config) uses plain DataStore.
 */
@Singleton
class SecureStorage @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val gson = Gson()

    private val prefs: SharedPreferences by lazy {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()

        EncryptedSharedPreferences.create(
            context,
            "passnet_secure_prefs",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        )
    }

    // ── Session ───────────────────────────────────────────────────────────────

    fun saveToken(token: String) = prefs.edit().putString(KEY_TOKEN, token).apply()

    fun getToken(): String? = prefs.getString(KEY_TOKEN, null)

    fun clearToken() = prefs.edit().remove(KEY_TOKEN).apply()

    // ── Device ID ─────────────────────────────────────────────────────────────

    fun getOrCreateDeviceId(): String {
        val existing = prefs.getString(KEY_DEVICE_ID, null)
        if (!existing.isNullOrBlank()) return existing
        val id = "android-${System.currentTimeMillis().toString(36)}-${(1..6).map { ('a'..'z').random() }.joinToString("")}"
        prefs.edit().putString(KEY_DEVICE_ID, id).apply()
        return id
    }

    // ── MikroTik credentials ──────────────────────────────────────────────────

    fun saveMikroTikConfig(ip: String, user: String, password: String, hotspotServer: String, wifiName: String) {
        prefs.edit()
            .putString(KEY_MT_IP, ip)
            .putString(KEY_MT_USER, user)
            .putString(KEY_MT_PASSWORD, password)
            .putString(KEY_MT_HOTSPOT, hotspotServer)
            .putString(KEY_MT_WIFI, wifiName)
            .apply()
    }

    fun getMikroTikIp():         String = prefs.getString(KEY_MT_IP, "")       ?: ""
    fun getMikroTikUser():       String = prefs.getString(KEY_MT_USER, "")     ?: ""
    fun getMikroTikPassword():   String = prefs.getString(KEY_MT_PASSWORD, "") ?: ""
    fun getMikroTikHotspot():    String = prefs.getString(KEY_MT_HOTSPOT, "")  ?: ""
    fun getMikroTikWifiName():   String = prefs.getString(KEY_MT_WIFI, "")     ?: ""

    // ── Biometric flag ────────────────────────────────────────────────────────

    fun setBiometricEnabled(enabled: Boolean) =
        prefs.edit().putBoolean(KEY_BIOMETRIC, enabled).apply()

    fun isBiometricEnabled(): Boolean = prefs.getBoolean(KEY_BIOMETRIC, false)

    // ── Bluetooth printer ─────────────────────────────────────────────────────

    fun saveSelectedPrinterAddress(address: String) =
        prefs.edit().putString(KEY_PRINTER_ADDRESS, address).apply()

    fun saveSelectedPrinterName(name: String) =
        prefs.edit().putString(KEY_PRINTER_NAME, name).apply()

    fun getSelectedPrinterAddress(): String? = prefs.getString(KEY_PRINTER_ADDRESS, null)
    fun getSelectedPrinterName():    String? = prefs.getString(KEY_PRINTER_NAME, null)

    // ── Portal config (business name + color) ─────────────────────────────────

    fun savePortalConfig(businessName: String, primaryColor: String) {
        prefs.edit()
            .putString(KEY_PORTAL_NAME, businessName)
            .putString(KEY_PORTAL_COLOR, primaryColor)
            .apply()
    }

    fun getPortalBusinessName(): String = prefs.getString(KEY_PORTAL_NAME, "") ?: ""
    fun getPortalColor():        String = prefs.getString(KEY_PORTAL_COLOR, "#E53935") ?: "#E53935"

    companion object {
        private const val KEY_TOKEN          = "license_token"
        private const val KEY_DEVICE_ID      = "device_id"
        private const val KEY_MT_IP          = "mikrotik_ip"
        private const val KEY_MT_USER        = "mikrotik_user"
        private const val KEY_MT_PASSWORD    = "mikrotik_password"
        private const val KEY_MT_HOTSPOT     = "mikrotik_hotspot"
        private const val KEY_MT_WIFI        = "mikrotik_wifi"
        private const val KEY_BIOMETRIC      = "biometric_enabled"
        private const val KEY_PRINTER_ADDRESS = "printer_address"
        private const val KEY_PRINTER_NAME   = "printer_name"
        private const val KEY_PORTAL_NAME    = "portal_business_name"
        private const val KEY_PORTAL_COLOR   = "portal_color"
    }
}
