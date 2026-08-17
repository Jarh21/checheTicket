package com.passnet.wifi.ui.plans

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.passnet.wifi.domain.model.Plan
import com.passnet.wifi.domain.model.PlanType
import com.passnet.wifi.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PlansScreen(vm: PlansViewModel = hiltViewModel()) {
    val state by vm.uiState.collectAsState()
    val snackbar = remember { SnackbarHostState() }

    LaunchedEffect(state.message) {
        state.message?.let { msg -> snackbar.showSnackbar(msg); vm.clearMessage() }
    }

    // Edit / Create dialog
    state.editingPlan?.let { plan ->
        PlanEditDialog(
            plan     = plan,
            onSave   = { vm.savePlan(it) },
            onCancel = { vm.cancelEdit() },
        )
    }

    // Delete confirmation dialog
    state.showDeleteConfirm?.let { plan ->
        AlertDialog(
            onDismissRequest = { vm.cancelDelete() },
            title            = { Text("Eliminar plan") },
            text             = { Text("¿Eliminar \"${plan.name}\"? Esta acción no se puede deshacer.") },
            confirmButton    = {
                Button(onClick = { vm.deletePlan(plan) },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)) {
                    Text("Eliminar")
                }
            },
            dismissButton    = { TextButton(onClick = { vm.cancelDelete() }) { Text("Cancelar") } }
        )
    }

    Scaffold(
        topBar  = { TopAppBar(title = { Text("Planes") }) },
        floatingActionButton = {
            FloatingActionButton(onClick = { vm.startCreate() }) {
                Icon(Icons.Default.Add, contentDescription = "Nuevo plan")
            }
        },
        snackbarHost = { SnackbarHost(snackbar) },
    ) { padding ->
        if (state.plans.isEmpty()) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Sin planes", style = MaterialTheme.typography.titleMedium)
                    Spacer(Modifier.height(8.dp))
                    Text("Toca + para agregar un plan de acceso.",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        style = MaterialTheme.typography.bodySmall)
                }
            }
        } else {
            LazyColumn(
                contentPadding = padding,
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
            ) {
                items(state.plans, key = { it.id }) { plan ->
                    PlanCard(
                        plan     = plan,
                        onEdit   = { vm.startEdit(plan) },
                        onDelete = { vm.confirmDelete(plan) },
                    )
                }
            }
        }
    }
}

@Composable
private fun PlanCard(plan: Plan, onEdit: () -> Unit, onDelete: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors   = CardDefaults.cardColors(containerColor = SurfaceVariant),
    ) {
        Row(
            Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(Modifier.weight(1f)) {
                Text(plan.name, style = MaterialTheme.typography.titleMedium)
                Text("${plan.durationLabel} · ${"$%.2f".format(plan.price)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text("↓${plan.downloadSpeed} Mbps / ↑${plan.uploadSpeed} Mbps",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
                if (plan.synced) {
                    Text("✓ Sincronizado con MikroTik",
                        style = MaterialTheme.typography.labelSmall, color = Success)
                }
            }
            IconButton(onClick = onEdit)   { Icon(Icons.Default.Edit,   contentDescription = "Editar") }
            IconButton(onClick = onDelete) { Icon(Icons.Default.Delete, contentDescription = "Eliminar",
                tint = MaterialTheme.colorScheme.error) }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun PlanEditDialog(plan: Plan, onSave: (Plan) -> Unit, onCancel: () -> Unit) {
    var name          by remember { mutableStateOf(plan.name) }
    var type          by remember { mutableStateOf(plan.type) }
    var duration      by remember { mutableStateOf(plan.duration.toString()) }
    var price         by remember { mutableStateOf(if (plan.price == 0.0) "" else plan.price.toString()) }
    var uploadSpeed   by remember { mutableStateOf(plan.uploadSpeed.toString()) }
    var downloadSpeed by remember { mutableStateOf(plan.downloadSpeed.toString()) }

    AlertDialog(
        onDismissRequest = onCancel,
        title            = { Text(if (plan.name.isEmpty()) "Nuevo plan" else "Editar plan") },
        text             = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(value = name, onValueChange = { name = it },
                    label = { Text("Nombre del plan") }, singleLine = true,
                    modifier = Modifier.fillMaxWidth())

                // Type selector
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(selected = type == PlanType.HOURS, onClick = { type = PlanType.HOURS },
                        label = { Text("Horas") })
                    FilterChip(selected = type == PlanType.DAYS,  onClick = { type = PlanType.DAYS },
                        label = { Text("Días") })
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(value = duration, onValueChange = { duration = it },
                        label = { Text(if (type == PlanType.HOURS) "Horas" else "Días") },
                        singleLine = true, modifier = Modifier.weight(1f),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
                    OutlinedTextField(value = price, onValueChange = { price = it },
                        label = { Text("Precio \$") }, singleLine = true, modifier = Modifier.weight(1f),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal))
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(value = downloadSpeed, onValueChange = { downloadSpeed = it },
                        label = { Text("Descarga Mbps") }, singleLine = true, modifier = Modifier.weight(1f),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
                    OutlinedTextField(value = uploadSpeed, onValueChange = { uploadSpeed = it },
                        label = { Text("Subida Mbps") }, singleLine = true, modifier = Modifier.weight(1f),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val saved = plan.copy(
                        name          = name.trim(),
                        type          = type,
                        duration      = duration.toIntOrNull() ?: 1,
                        price         = price.toDoubleOrNull() ?: 0.0,
                        uploadSpeed   = uploadSpeed.toIntOrNull() ?: 1,
                        downloadSpeed = downloadSpeed.toIntOrNull() ?: 2,
                        synced        = false,
                    )
                    onSave(saved)
                },
                enabled = name.isNotBlank() && duration.toIntOrNull() != null,
            ) { Text("Guardar") }
        },
        dismissButton = { TextButton(onClick = onCancel) { Text("Cancelar") } }
    )
}
