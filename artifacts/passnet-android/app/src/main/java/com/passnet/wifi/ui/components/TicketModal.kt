package com.passnet.wifi.ui.components

import android.bluetooth.BluetoothAdapter
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.print.PrintManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Print
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.core.content.ContextCompat
import androidx.hilt.navigation.compose.hiltViewModel
import com.passnet.wifi.data.printer.BluetoothPrinterInfo
import com.passnet.wifi.data.printer.BluetoothPrinterManager
import com.passnet.wifi.data.printer.EscPosCommands
import com.passnet.wifi.data.printer.PrintResult
import com.passnet.wifi.domain.model.Ticket
import com.passnet.wifi.ui.theme.*
import kotlinx.coroutines.launch
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@Composable
fun TicketModal(
    ticket: Ticket,
    wifiName: String,
    onDismiss: () -> Unit,
    printerManager: BluetoothPrinterManager = hiltViewModel<TicketModalViewModel>().printerManager,
) {
    val context       = LocalContext.current
    val scope         = rememberCoroutineScope()
    val formatter     = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(ZoneId.systemDefault())

    val createdStr = formatter.format(ticket.createdAt)
    val expiresStr = formatter.format(ticket.expiresAt)

    var printerList by remember { mutableStateOf<List<BluetoothPrinterInfo>>(emptyList()) }
    var showPrinterPicker by remember { mutableStateOf(false) }
    var printMessage by remember { mutableStateOf<String?>(null) }
    var printing by remember { mutableStateOf(false) }

    // Bluetooth permission launcher (Android 12+)
    val btPermLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { results ->
        val granted = results.values.all { it }
        if (granted) {
            printerList = printerManager.getPairedPrinters()
            showPrinterPicker = true
        } else {
            printMessage = "Permisos Bluetooth denegados."
        }
    }

    fun openBluetoothPicker() {
        val permsNeeded = mutableListOf<String>()
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
            if (ContextCompat.checkSelfPermission(context, android.Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED)
                permsNeeded += android.Manifest.permission.BLUETOOTH_CONNECT
            if (ContextCompat.checkSelfPermission(context, android.Manifest.permission.BLUETOOTH_SCAN) != PackageManager.PERMISSION_GRANTED)
                permsNeeded += android.Manifest.permission.BLUETOOTH_SCAN
        }
        if (permsNeeded.isNotEmpty()) {
            btPermLauncher.launch(permsNeeded.toTypedArray())
        } else {
            if (!printerManager.isBluetoothEnabled()) {
                printMessage = "Activa el Bluetooth e intenta de nuevo."
                return
            }
            printerList = printerManager.getPairedPrinters()
            if (printerList.isEmpty()) {
                printMessage = "No hay impresoras emparejadas. Empareja tu impresora en la configuración de Bluetooth de Android."
            } else {
                showPrinterPicker = true
            }
        }
    }

    fun shareTicket() {
        val text = EscPosCommands.buildTicketText(
            username = ticket.username, password = ticket.password,
            planName = ticket.planName, durationLabel = ticket.durationLabel,
            price = ticket.price, createdAt = createdStr, expiresAt = expiresStr,
            wifiName = wifiName,
        )
        val sendIntent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, text)
        }
        context.startActivity(Intent.createChooser(sendIntent, "Compartir ticket"))
    }

    // Bluetooth printer picker dialog
    if (showPrinterPicker) {
        AlertDialog(
            onDismissRequest = { showPrinterPicker = false },
            title            = { Text("Seleccionar impresora") },
            text             = {
                Column {
                    printerList.forEach { printer ->
                        TextButton(
                            onClick = {
                                showPrinterPicker = false
                                printing = true
                                val base64 = EscPosCommands.buildTicketBase64(
                                    username = ticket.username, password = ticket.password,
                                    planName = ticket.planName, durationLabel = ticket.durationLabel,
                                    price = ticket.price, createdAt = createdStr, expiresAt = expiresStr,
                                    wifiName = wifiName,
                                )
                                scope.launch {
                                    val result = printerManager.print(printer.address, base64)
                                    printing = false
                                    printMessage = when (result) {
                                        is PrintResult.Success -> "✓ Ticket enviado a ${printer.name}"
                                        is PrintResult.Error   -> result.message
                                    }
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Column(Modifier.fillMaxWidth()) {
                                Text(printer.name.ifBlank { "Impresora" })
                                Text(printer.address,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }
                }
            },
            confirmButton   = {},
            dismissButton   = {
                TextButton(onClick = { showPrinterPicker = false }) { Text("Cancelar") }
            }
        )
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties       = DialogProperties(usePlatformDefaultWidth = false),
    ) {
        Surface(
            modifier      = Modifier
                .fillMaxWidth(0.93f)
                .wrapContentHeight(),
            shape         = MaterialTheme.shapes.large,
            color         = Surface,
            tonalElevation = 4.dp,
        ) {
            Column(
                modifier = Modifier
                    .verticalScroll(rememberScrollState())
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("Ticket Generado", style = MaterialTheme.typography.titleMedium)
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Cerrar")
                    }
                }

                HorizontalDivider(Modifier.padding(vertical = 8.dp))

                // Credentials box
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors   = CardDefaults.cardColors(containerColor = SurfaceVariant),
                ) {
                    Column(
                        Modifier.padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        Text("USUARIO", style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text(ticket.username,
                            style = MaterialTheme.typography.headlineMedium.copy(fontFamily = FontFamily.Monospace),
                            color = PassnetRed)
                        Spacer(Modifier.height(8.dp))
                        Text("CLAVE", style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text(ticket.password,
                            style = MaterialTheme.typography.headlineMedium.copy(fontFamily = FontFamily.Monospace),
                            color = MaterialTheme.colorScheme.onSurface)
                    }
                }

                Spacer(Modifier.height(12.dp))

                // Details
                TicketRow("Plan",      ticket.planName)
                TicketRow("Duración",  ticket.durationLabel)
                TicketRow("Precio",    "${"$%.2f".format(ticket.price)}")
                TicketRow("Inicio",    createdStr)
                TicketRow("Expira",    expiresStr)
                TicketRow("Red WiFi",  wifiName)

                Spacer(Modifier.height(16.dp))

                // Action buttons
                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    OutlinedButton(
                        onClick  = { shareTicket() },
                        modifier = Modifier.weight(1f),
                    ) {
                        Icon(Icons.Default.Share, contentDescription = null, Modifier.size(18.dp))
                        Spacer(Modifier.width(4.dp))
                        Text("Compartir")
                    }
                    Button(
                        onClick  = { openBluetoothPicker() },
                        modifier = Modifier.weight(1f),
                        enabled  = !printing,
                    ) {
                        if (printing) CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp,
                            color = MaterialTheme.colorScheme.onPrimary)
                        else {
                            Icon(Icons.Default.Print, contentDescription = null, Modifier.size(18.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("Imprimir")
                        }
                    }
                }

                printMessage?.let { msg ->
                    Spacer(Modifier.height(8.dp))
                    Text(msg, style = MaterialTheme.typography.bodySmall,
                        color = if (msg.startsWith("✓")) Success else Error)
                }
            }
        }
    }
}

@Composable
private fun TicketRow(label: String, value: String) {
    Row(
        Modifier.fillMaxWidth().padding(vertical = 3.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(label, color = MaterialTheme.colorScheme.onSurfaceVariant,
            style = MaterialTheme.typography.bodySmall)
        Text(value, style = MaterialTheme.typography.bodySmall)
    }
}
