package com.passnet.wifi.ui.settings

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.passnet.wifi.domain.model.MikroTikConfig
import com.passnet.wifi.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onLogout: () -> Unit,
    vm: SettingsViewModel = hiltViewModel(),
) {
    val state   by vm.uiState.collectAsState()
    val snackbar = remember { SnackbarHostState() }
    var showRouterPass by remember { mutableStateOf(false) }
    var showLogoutConfirm by remember { mutableStateOf(false) }

    LaunchedEffect(state.message) {
        state.message?.let { msg -> snackbar.showSnackbar(msg); vm.clearMessage() }
    }

    // Printer picker dialog
    if (state.showPrinterList) {
        AlertDialog(
            onDismissRequest = { vm.dismissPrinterList() },
            title = { Text("Impresoras emparejadas") },
            text = {
                Column {
                    if (state.pairedPrinters.isEmpty()) {
                        Text("No hay impresoras emparejadas. Ve a Configuración de Android → Bluetooth.",
                            style = MaterialTheme.typography.bodySmall)
                    } else {
                        state.pairedPrinters.forEach { printer ->
                            TextButton(
                                onClick  = { vm.selectPrinter(printer) },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(Modifier.fillMaxWidth()) {
                                    Text(printer.name.ifBlank { "Desconocido" })
                                    Text(printer.address, style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {},
            dismissButton = { TextButton(onClick = { vm.dismissPrinterList() }) { Text("Cerrar") } }
        )
    }

    // Logout confirmation
    if (showLogoutConfirm) {
        AlertDialog(
            onDismissRequest = { showLogoutConfirm = false },
            title = { Text("Cerrar sesión") },
            text  = { Text("¿Seguro que deseas cerrar sesión?") },
            confirmButton = {
                Button(onClick = { vm.logout(); onLogout() },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)) {
                    Text("Cerrar sesión")
                }
            },
            dismissButton = { TextButton(onClick = { showLogoutConfirm = false }) { Text("Cancelar") } }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Ajustes") },
                actions = {
                    IconButton(onClick = { showLogoutConfirm = true }) {
                        Icon(Icons.Default.Logout, contentDescription = "Cerrar sesión")
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbar) },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(padding)
                .padding(horizontal = 16.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            // ── MikroTik connection ───────────────────────────────────────────
            SectionTitle("Conexión MikroTik")

            val cfg = state.config
            OutlinedTextField(
                value = cfg.ip, onValueChange = { vm.updateConfig(cfg.copy(ip = it)) },
                label = { Text("IP del router") }, singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri),
                placeholder = { Text("192.168.88.1") },
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = cfg.user, onValueChange = { vm.updateConfig(cfg.copy(user = it)) },
                    label = { Text("Usuario") }, singleLine = true, modifier = Modifier.weight(1f),
                )
                OutlinedTextField(
                    value = cfg.password, onValueChange = { vm.updateConfig(cfg.copy(password = it)) },
                    label = { Text("Contraseña") }, singleLine = true, modifier = Modifier.weight(1f),
                    visualTransformation = if (showRouterPass) VisualTransformation.None else PasswordVisualTransformation(),
                    trailingIcon = {
                        IconButton(onClick = { showRouterPass = !showRouterPass }) {
                            Icon(
                                if (showRouterPass) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                                contentDescription = null,
                            )
                        }
                    }
                )
            }
            OutlinedTextField(
                value = cfg.hotspotServer, onValueChange = { vm.updateConfig(cfg.copy(hotspotServer = it)) },
                label = { Text("Servidor hotspot") }, singleLine = true, modifier = Modifier.fillMaxWidth(),
                placeholder = { Text("hotspot1") },
            )
            OutlinedTextField(
                value = cfg.wifiName, onValueChange = { vm.updateConfig(cfg.copy(wifiName = it)) },
                label = { Text("Nombre de la red WiFi") }, singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(
                    onClick  = { vm.testConnection() },
                    modifier = Modifier.weight(1f),
                    enabled  = !state.testLoading,
                ) {
                    if (state.testLoading) CircularProgressIndicator(Modifier.size(16.dp), strokeWidth = 2.dp)
                    else Text("Probar conexión")
                }
                Button(onClick = { vm.saveConfig() }, modifier = Modifier.weight(1f)) {
                    Text("Guardar")
                }
            }

            state.testResult?.let { result ->
                val isOk = result.startsWith("Conexión exitosa") || result.startsWith("✓")
                Text(result, style = MaterialTheme.typography.bodySmall,
                    color = if (isOk) Success else Error)
            }

            HorizontalDivider()

            // ── Bluetooth printer ─────────────────────────────────────────────
            SectionTitle("Impresora Bluetooth")
            state.savedPrinterName?.let { name ->
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("✓ $name", style = MaterialTheme.typography.bodySmall, color = Success,
                        modifier = Modifier.weight(1f))
                }
            }
            OutlinedButton(
                onClick  = { vm.loadPairedPrinters() },
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Seleccionar impresora emparejada")
            }
            Text("58 mm · Bluetooth Classic ESC/POS · empareja primero en Ajustes de Android",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant)

            HorizontalDivider()

            // ── Hotspot portal ────────────────────────────────────────────────
            SectionTitle("Portal del Hotspot")
            OutlinedTextField(
                value = state.portalBusinessName,
                onValueChange = { vm.updatePortalName(it) },
                label = { Text("Nombre del negocio") }, singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = state.portalColor,
                onValueChange = { vm.updatePortalColor(it) },
                label = { Text("Color principal (hex)") }, singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text("#E53935") },
            )
            Button(
                onClick  = { vm.uploadPortal() },
                modifier = Modifier.fillMaxWidth(),
                enabled  = !state.portalUploading && state.portalBusinessName.isNotBlank(),
            ) {
                if (state.portalUploading) CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp,
                    color = MaterialTheme.colorScheme.onPrimary)
                else Text("Subir portal al router")
            }
            state.portalMessage?.let { msg ->
                val ok = msg.startsWith("✓")
                Text(msg, style = MaterialTheme.typography.bodySmall,
                    color = if (ok) Success else Error)
            }

            HorizontalDivider()

            // ── License info ──────────────────────────────────────────────────
            SectionTitle("Licencia")
            if (state.accountEmail.isNotBlank()) {
                LicenseRow("Cuenta", state.accountName)
                LicenseRow("Correo", state.accountEmail)
                LicenseRow("Estado", state.licenseStatus)
                LicenseRow("Vence",  state.licenseExpiry.take(10))
            } else {
                Text("Sin información de licencia disponible.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
            }

            HorizontalDivider()

            // ── About ─────────────────────────────────────────────────────────
            Text(
                "PASSNET WIFI v1.0.0 · MikroTik RouterOS v7 · REST API",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            Spacer(Modifier.height(24.dp))
        }
    }
}

@Composable
private fun SectionTitle(text: String) {
    Text(text, style = MaterialTheme.typography.titleMedium, color = PassnetRed)
}

@Composable
private fun LicenseRow(label: String, value: String) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(value, style = MaterialTheme.typography.bodySmall)
    }
}
