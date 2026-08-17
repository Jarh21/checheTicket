package com.passnet.wifi.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.passnet.wifi.data.repository.AuthRepository
import com.passnet.wifi.data.repository.AuthResult
import com.passnet.wifi.data.repository.MikroTikRepository
import com.passnet.wifi.data.repository.PlanRepository
import com.passnet.wifi.data.repository.TicketRepository
import com.passnet.wifi.domain.model.LicenseSession
import com.passnet.wifi.domain.model.MikroTikConfig
import com.passnet.wifi.domain.model.Plan
import com.passnet.wifi.domain.model.Ticket
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class DashboardUiState(
    val session: LicenseSession? = null,
    val config: MikroTikConfig   = MikroTikConfig(),
    val plans: List<Plan>        = emptyList(),
    val tickets: List<Ticket>    = emptyList(),
    val selectedPlanId: String?  = null,
    val generatingTicket: Boolean = false,
    val generatedTicket: Ticket? = null,
    val error: String?           = null,
    val todayCount: Int          = 0,
    val activeCount: Int         = 0,
)

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val authRepo:     AuthRepository,
    private val mikrotikRepo: MikroTikRepository,
    private val planRepo:     PlanRepository,
    private val ticketRepo:   TicketRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    init {
        val config = mikrotikRepo.loadConfig()
        _uiState.update { it.copy(config = config) }

        viewModelScope.launch {
            planRepo.observePlans().collect { plans ->
                _uiState.update { state ->
                    state.copy(
                        plans          = plans,
                        selectedPlanId = state.selectedPlanId ?: plans.firstOrNull()?.id,
                    )
                }
            }
        }

        viewModelScope.launch {
            ticketRepo.observeTickets().collect { tickets ->
                val now = java.time.Instant.now()
                _uiState.update { state ->
                    state.copy(
                        tickets     = tickets,
                        activeCount = tickets.count { !it.isExpired },
                        todayCount  = tickets.count { ticket ->
                            val day = java.time.LocalDate.now(java.time.ZoneId.systemDefault())
                                .atStartOfDay(java.time.ZoneId.systemDefault()).toInstant()
                            ticket.createdAt.isAfter(day)
                        },
                    )
                }
            }
        }
    }

    fun selectPlan(planId: String) = _uiState.update { it.copy(selectedPlanId = planId) }

    fun generateTicket() {
        val state = _uiState.value
        val plan = state.plans.find { it.id == state.selectedPlanId } ?: run {
            _uiState.update { it.copy(error = "Selecciona un plan primero") }
            return
        }
        if (!state.config.isConfigured) {
            _uiState.update { it.copy(error = "Configura el MikroTik en Ajustes primero") }
            return
        }
        if (state.generatingTicket) return

        viewModelScope.launch {
            _uiState.update { it.copy(generatingTicket = true, error = null) }
            ticketRepo.generateTicket(state.config, plan)
                .onSuccess { ticket ->
                    _uiState.update { it.copy(generatingTicket = false, generatedTicket = ticket) }
                }
                .onFailure { e ->
                    _uiState.update { it.copy(generatingTicket = false, error = e.message) }
                }
        }
    }

    fun dismissTicketModal() = _uiState.update { it.copy(generatedTicket = null) }
    fun clearError()          = _uiState.update { it.copy(error = null) }

    fun logout() {
        viewModelScope.launch { authRepo.logout() }
    }
}
