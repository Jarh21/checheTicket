package com.passnet.wifi.ui.history

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DeleteSweep
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.passnet.wifi.domain.model.Ticket
import com.passnet.wifi.ui.components.TicketModal
import com.passnet.wifi.ui.theme.*
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HistoryScreen(vm: HistoryViewModel = hiltViewModel()) {
    val state    by vm.uiState.collectAsState()
    val snackbar = remember { SnackbarHostState() }
    val fmt      = DateTimeFormatter.ofPattern("dd/MM/yy HH:mm").withZone(ZoneId.systemDefault())

    LaunchedEffect(state.message) {
        state.message?.let { msg -> snackbar.showSnackbar(msg); vm.clearMessage() }
    }

    // Delete confirmation
    state.confirmDelete?.let { ticket ->
        AlertDialog(
            onDismissRequest = { vm.cancelDelete() },
            title            = { Text("Eliminar ticket") },
            text             = {
                Column {
                    Text("¿Eliminar el usuario \"${ticket.username}\" del MikroTik y del historial?")
                    Spacer(Modifier.height(8.dp))
                    Text("Si el router no está disponible, usa 'Solo local'.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            },
            confirmButton = {
                Button(onClick = { vm.deleteTicket(ticket) },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)) {
                    Text("Eliminar")
                }
            },
            dismissButton = {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    TextButton(onClick = { vm.deleteLocalOnly(ticket) }) { Text("Solo local") }
                    TextButton(onClick = { vm.cancelDelete() })          { Text("Cancelar") }
                }
            }
        )
    }

    // Ticket detail modal — re-use TicketModal for printing/sharing
    state.selectedTicket?.let { ticket ->
        TicketModal(
            ticket    = ticket,
            wifiName  = "",
            onDismiss = { vm.dismissDetail() },
        )
    }

    val active  = state.tickets.filter { !it.isExpired }
    val expired = state.tickets.filter { it.isExpired }

    Scaffold(
        topBar = {
            TopAppBar(
                title  = { Text("Historial") },
                actions = {
                    if (expired.isNotEmpty()) {
                        IconButton(onClick = { vm.cleanExpired() }) {
                            Icon(Icons.Default.DeleteSweep, contentDescription = "Limpiar vencidos")
                        }
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbar) },
    ) { padding ->
        if (state.tickets.isEmpty()) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Text("Sin tickets — genera uno desde el Panel.",
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        } else {
            LazyColumn(
                contentPadding = padding,
                modifier       = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                if (active.isNotEmpty()) {
                    item { SectionHeader("Activos (${active.size})") }
                    items(active, key = { it.id }) { ticket ->
                        TicketRow(
                            ticket      = ticket,
                            fmt         = fmt,
                            onPress     = { vm.selectTicket(ticket) },
                            onDelete    = { vm.confirmDelete(ticket) },
                        )
                    }
                }
                if (expired.isNotEmpty()) {
                    item { SectionHeader("Vencidos (${expired.size})") }
                    items(expired, key = { it.id }) { ticket ->
                        TicketRow(
                            ticket   = ticket,
                            fmt      = fmt,
                            onPress  = { vm.selectTicket(ticket) },
                            onDelete = { vm.confirmDelete(ticket) },
                            dimmed   = true,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun SectionHeader(text: String) {
    Text(text, style = MaterialTheme.typography.labelSmall,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        modifier = Modifier.padding(vertical = 6.dp))
}

@Composable
private fun TicketRow(
    ticket: Ticket,
    fmt: DateTimeFormatter,
    onPress: () -> Unit,
    onDelete: () -> Unit,
    dimmed: Boolean = false,
) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable { onPress() },
        colors   = CardDefaults.cardColors(containerColor = SurfaceVariant.copy(
            alpha = if (dimmed) 0.5f else 1f)),
    ) {
        Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text(ticket.username,
                        fontFamily = FontFamily.Monospace,
                        style      = MaterialTheme.typography.titleMedium,
                        color      = if (dimmed) OnSurfaceMuted else OnSurface)
                    Text("/ ${ticket.password}",
                        fontFamily = FontFamily.Monospace,
                        style      = MaterialTheme.typography.bodySmall,
                        color      = OnSurfaceMuted)
                }
                Text("${ticket.planName} · ${ticket.durationLabel} · ${"$%.2f".format(ticket.price)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text("Expira: ${fmt.format(ticket.expiresAt)}",
                    style = MaterialTheme.typography.labelSmall,
                    color = if (ticket.isExpired) Error else Success)
            }
            IconButton(onClick = onDelete) {
                Icon(Icons.Default.DeleteSweep, contentDescription = "Eliminar",
                    tint = MaterialTheme.colorScheme.error.copy(alpha = 0.7f))
            }
        }
    }
}
