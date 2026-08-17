package com.passnet.wifi.ui.dashboard

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.passnet.wifi.domain.model.Plan
import com.passnet.wifi.ui.components.TicketModal
import com.passnet.wifi.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    onLogout: () -> Unit,
    vm: DashboardViewModel = hiltViewModel(),
) {
    val state by vm.uiState.collectAsState()

    // Show ticket modal
    state.generatedTicket?.let { ticket ->
        TicketModal(
            ticket   = ticket,
            wifiName = state.config.wifiName,
            onDismiss = { vm.dismissTicketModal() },
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("PASSNET WIFI", color = PassnetRed) },
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(padding)
                .padding(16.dp),
        ) {
            // License / session info
            state.session?.let { s ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors   = CardDefaults.cardColors(containerColor = SurfaceVariant),
                ) {
                    Column(Modifier.padding(14.dp)) {
                        Text(s.accountName, style = MaterialTheme.typography.titleMedium)
                        Text(s.accountEmail, style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Spacer(Modifier.height(6.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            StatusChip(
                                label = if (s.licenseStatus == "active") "Activa" else "Inactiva",
                                color = if (s.licenseStatus == "active") Success else Error,
                            )
                        }
                    }
                }
                Spacer(Modifier.height(16.dp))
            }

            // Stats row
            Row(
                modifier            = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                StatCard("Hoy",     state.todayCount.toString(),  Modifier.weight(1f))
                StatCard("Activos", state.activeCount.toString(), Modifier.weight(1f))
                StatCard("Total",   state.tickets.size.toString(),Modifier.weight(1f))
            }

            Spacer(Modifier.height(20.dp))

            // MikroTik warning
            if (!state.config.isConfigured) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors   = CardDefaults.cardColors(containerColor = WarningContainer),
                ) {
                    Text(
                        "⚠ Configura el MikroTik en Ajustes para generar tickets.",
                        modifier = Modifier.padding(12.dp),
                        style    = MaterialTheme.typography.bodySmall,
                        color    = Warning,
                    )
                }
                Spacer(Modifier.height(16.dp))
            }

            // Plan selector
            Text("Selecciona un plan", style = MaterialTheme.typography.titleMedium)
            Spacer(Modifier.height(8.dp))

            if (state.plans.isEmpty()) {
                Text("Sin planes — agrégalos en la pestaña Planes.",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.bodySmall)
            } else {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(state.plans) { plan ->
                        PlanChip(
                            plan     = plan,
                            selected = plan.id == state.selectedPlanId,
                            onClick  = { vm.selectPlan(plan.id) },
                        )
                    }
                }
            }

            Spacer(Modifier.height(24.dp))

            // Generate button
            Button(
                onClick  = { vm.generateTicket() },
                modifier = Modifier.fillMaxWidth().height(52.dp),
                enabled  = state.config.isConfigured && state.selectedPlanId != null && !state.generatingTicket,
            ) {
                if (state.generatingTicket) {
                    CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp,
                        color = MaterialTheme.colorScheme.onPrimary)
                } else {
                    Icon(Icons.Default.Add, contentDescription = null)
                    Spacer(Modifier.width(8.dp))
                    Text("Generar ticket")
                }
            }

            // Error
            state.error?.let { err ->
                Spacer(Modifier.height(12.dp))
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors   = CardDefaults.cardColors(containerColor = ErrorContainer),
                ) {
                    Text(err, Modifier.padding(12.dp), color = Error,
                        style = MaterialTheme.typography.bodySmall)
                }
            }
        }
    }
}

@Composable
private fun StatCard(label: String, value: String, modifier: Modifier = Modifier) {
    Card(modifier = modifier, colors = CardDefaults.cardColors(containerColor = SurfaceVariant)) {
        Column(Modifier.padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(value, style = MaterialTheme.typography.titleLarge, color = PassnetRed)
            Text(label, style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun PlanChip(plan: Plan, selected: Boolean, onClick: () -> Unit) {
    FilterChip(
        selected = selected,
        onClick  = onClick,
        label    = {
            Column(Modifier.padding(vertical = 4.dp)) {
                Text(plan.name, style = MaterialTheme.typography.bodyMedium)
                Text("${plan.durationLabel} · ${"$%.2f".format(plan.price)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    )
}

@Composable
private fun StatusChip(label: String, color: androidx.compose.ui.graphics.Color) {
    Surface(
        shape  = MaterialTheme.shapes.small,
        color  = color.copy(alpha = 0.15f),
    ) {
        Text(label, Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
            color = color, style = MaterialTheme.typography.labelSmall)
    }
}
