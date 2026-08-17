package com.passnet.wifi.ui.plans

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.passnet.wifi.data.repository.MikroTikRepository
import com.passnet.wifi.data.repository.PlanRepository
import com.passnet.wifi.domain.model.Plan
import com.passnet.wifi.domain.model.PlanType
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class PlansUiState(
    val plans: List<Plan>       = emptyList(),
    val loading: Boolean        = false,
    val error: String?          = null,
    val message: String?        = null,
    val editingPlan: Plan?      = null,   // non-null → show edit dialog
    val showDeleteConfirm: Plan? = null,
)

@HiltViewModel
class PlansViewModel @Inject constructor(
    private val planRepo:     PlanRepository,
    private val mikrotikRepo: MikroTikRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(PlansUiState())
    val uiState: StateFlow<PlansUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            planRepo.observePlans().collect { plans ->
                _uiState.update { it.copy(plans = plans) }
            }
        }
    }

    fun startCreate() {
        _uiState.update { it.copy(
            editingPlan = Plan(name = "", type = PlanType.HOURS, duration = 1, price = 0.0,
                uploadSpeed = 1, downloadSpeed = 2),
        ) }
    }

    fun startEdit(plan: Plan) = _uiState.update { it.copy(editingPlan = plan) }

    fun cancelEdit() = _uiState.update { it.copy(editingPlan = null) }

    fun savePlan(plan: Plan) {
        viewModelScope.launch {
            _uiState.update { it.copy(loading = true) }
            planRepo.save(plan)

            // Attempt profile sync in background — non-blocking
            val config = mikrotikRepo.loadConfig()
            if (config.isConfigured) {
                val err = planRepo.syncProfile(config, plan)
                _uiState.update { it.copy(
                    loading = false,
                    editingPlan = null,
                    message = if (err != null) "Plan guardado (sin sincronizar: $err)" else "Plan guardado y sincronizado",
                ) }
            } else {
                _uiState.update { it.copy(loading = false, editingPlan = null, message = "Plan guardado") }
            }
        }
    }

    fun confirmDelete(plan: Plan) = _uiState.update { it.copy(showDeleteConfirm = plan) }
    fun cancelDelete()            = _uiState.update { it.copy(showDeleteConfirm = null) }

    fun deletePlan(plan: Plan) {
        viewModelScope.launch {
            planRepo.delete(plan)
            _uiState.update { it.copy(showDeleteConfirm = null, message = "Plan eliminado") }
        }
    }

    fun clearMessage() = _uiState.update { it.copy(message = null) }
    fun clearError()   = _uiState.update { it.copy(error = null) }
}
