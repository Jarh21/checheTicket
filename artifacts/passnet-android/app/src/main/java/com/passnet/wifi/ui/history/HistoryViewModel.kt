package com.passnet.wifi.ui.history

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.passnet.wifi.data.repository.MikroTikRepository
import com.passnet.wifi.data.repository.TicketRepository
import com.passnet.wifi.domain.model.Ticket
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class HistoryUiState(
    val tickets: List<Ticket>  = emptyList(),
    val loading: Boolean       = false,
    val message: String?       = null,
    val selectedTicket: Ticket? = null,
    val confirmDelete: Ticket?  = null,
)

@HiltViewModel
class HistoryViewModel @Inject constructor(
    private val ticketRepo:   TicketRepository,
    private val mikrotikRepo: MikroTikRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(HistoryUiState())
    val uiState: StateFlow<HistoryUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            ticketRepo.observeTickets().collect { tickets ->
                _uiState.update { it.copy(tickets = tickets) }
            }
        }
    }

    fun selectTicket(ticket: Ticket)  = _uiState.update { it.copy(selectedTicket = ticket) }
    fun dismissDetail()               = _uiState.update { it.copy(selectedTicket = null) }
    fun confirmDelete(ticket: Ticket) = _uiState.update { it.copy(confirmDelete = ticket) }
    fun cancelDelete()                = _uiState.update { it.copy(confirmDelete = null) }

    fun deleteTicket(ticket: Ticket) {
        viewModelScope.launch {
            _uiState.update { it.copy(loading = true, confirmDelete = null, selectedTicket = null) }
            val config = mikrotikRepo.loadConfig()
            val err = if (config.isConfigured) {
                ticketRepo.deleteTicket(config, ticket)
            } else {
                ticketRepo.deleteLocalOnly(ticket.id)
                null
            }
            _uiState.update { it.copy(
                loading = false,
                message = if (err != null) "Error al eliminar: $err" else "Ticket eliminado",
            ) }
        }
    }

    fun deleteLocalOnly(ticket: Ticket) {
        viewModelScope.launch {
            ticketRepo.deleteLocalOnly(ticket.id)
            _uiState.update { it.copy(selectedTicket = null, message = "Eliminado solo localmente") }
        }
    }

    fun cleanExpired() {
        viewModelScope.launch {
            ticketRepo.deleteExpired()
            _uiState.update { it.copy(message = "Tickets vencidos eliminados") }
        }
    }

    fun clearMessage() = _uiState.update { it.copy(message = null) }
}
