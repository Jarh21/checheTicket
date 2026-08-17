package com.passnet.wifi.domain.model

data class MikroTikConfig(
    val ip: String = "",
    val user: String = "",
    val password: String = "",
    val hotspotServer: String = "",
    val wifiName: String = "",
) {
    val isConfigured: Boolean
        get() = ip.isNotBlank() && user.isNotBlank() && password.isNotBlank()

    val baseUrl: String get() = "http://${ip}/rest"
}
