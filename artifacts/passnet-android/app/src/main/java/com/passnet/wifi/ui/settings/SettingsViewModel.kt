package com.passnet.wifi.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.passnet.wifi.data.printer.BluetoothPrinterInfo
import com.passnet.wifi.data.printer.BluetoothPrinterManager
import com.passnet.wifi.data.repository.AuthRepository
import com.passnet.wifi.data.repository.MikroTikRepository
import com.passnet.wifi.domain.model.MikroTikConfig
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SettingsUiState(
    val config: MikroTikConfig     = MikroTikConfig(),
    val testResult: String?        = null,
    val testLoading: Boolean       = false,
    val savedPrinterName: String?  = null,
    val savedPrinterAddress: String? = null,
    val pairedPrinters: List<BluetoothPrinterInfo> = emptyList(),
    val showPrinterList: Boolean   = false,
    val portalBusinessName: String = "",
    val portalColor: String        = "#E53935",
    val portalUploading: Boolean   = false,
    val portalMessage: String?     = null,
    val message: String?           = null,
    val accountEmail: String       = "",
    val accountName: String        = "",
    val licenseStatus: String      = "",
    val licenseExpiry: String      = "",
)

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val authRepo:     AuthRepository,
    private val mikrotikRepo: MikroTikRepository,
    private val printer:      BluetoothPrinterManager,
) : ViewModel() {

    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    init {
        val cfg = mikrotikRepo.loadConfig()
        _uiState.update { it.copy(
            config              = cfg,
            savedPrinterAddress = com.passnet.wifi.data.local.SecureStorage::class.java.name, // placeholder
        ) }
        // Load session info from the repository's stored token via restoreSession
        viewModelScope.launch {
            val result = authRepo.restoreSession()
            if (result is com.passnet.wifi.data.repository.AuthResult.Success) {
                val s = result.data
                _uiState.update { it.copy(
                    accountEmail   = s.accountEmail,
                    accountName    = s.accountName,
                    licenseStatus  = if (s.licenseStatus == "active") "Activa" else "Inactiva",
                    licenseExpiry  = s.expiresAt,
                ) }
            }
        }
    }

    fun updateConfig(config: MikroTikConfig) = _uiState.update { it.copy(config = config) }

    fun saveConfig() {
        val cfg = _uiState.value.config
        mikrotikRepo.saveConfig(cfg)
        _uiState.update { it.copy(message = "Configuración guardada") }
    }

    fun testConnection() {
        val cfg = _uiState.value.config
        if (!cfg.isConfigured) {
            _uiState.update { it.copy(testResult = "Completa los campos del router primero") }
            return
        }
        viewModelScope.launch {
            _uiState.update { it.copy(testLoading = true, testResult = null) }
            val result = mikrotikRepo.testConnection(cfg)
            _uiState.update { it.copy(
                testLoading = false,
                testResult  = result.fold({ it }, { it.message }),
            ) }
        }
    }

    fun loadPairedPrinters() {
        val printers = printer.getPairedPrinters()
        _uiState.update { it.copy(pairedPrinters = printers, showPrinterList = true) }
    }

    fun selectPrinter(info: BluetoothPrinterInfo) {
        _uiState.update { it.copy(
            savedPrinterAddress = info.address,
            savedPrinterName    = info.name,
            showPrinterList     = false,
            message             = "Impresora seleccionada: ${info.name}",
        ) }
    }

    fun dismissPrinterList() = _uiState.update { it.copy(showPrinterList = false) }

    fun updatePortalName(name: String)  = _uiState.update { it.copy(portalBusinessName = name) }
    fun updatePortalColor(color: String) = _uiState.update { it.copy(portalColor = color) }

    fun uploadPortal() {
        val state = _uiState.value
        val cfg   = state.config
        if (!cfg.isConfigured) {
            _uiState.update { it.copy(portalMessage = "Configura el MikroTik primero") }
            return
        }
        viewModelScope.launch {
            _uiState.update { it.copy(portalUploading = true, portalMessage = null) }
            val html   = com.passnet.wifi.data.printer.EscPosCommands
                .buildPortalHtml(state.portalBusinessName, state.portalColor)
            val result = mikrotikRepo.uploadPortal(cfg, html)
            _uiState.update { it.copy(
                portalUploading = false,
                portalMessage   = result.fold({ "✓ Portal actualizado" }, { it.message }),
            ) }
        }
    }

    fun logout() {
        viewModelScope.launch { authRepo.logout() }
    }

    fun clearMessage()      = _uiState.update { it.copy(message = null) }
    fun clearTestResult()   = _uiState.update { it.copy(testResult = null) }
    fun clearPortalMessage()= _uiState.update { it.copy(portalMessage = null) }
}
