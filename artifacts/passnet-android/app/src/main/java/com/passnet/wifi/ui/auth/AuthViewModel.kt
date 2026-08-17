package com.passnet.wifi.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.passnet.wifi.data.repository.AuthRepository
import com.passnet.wifi.data.repository.AuthResult
import com.passnet.wifi.domain.model.AuthState
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val repo: AuthRepository,
) : ViewModel() {

    private val _authState = MutableStateFlow<AuthState>(AuthState.Loading)
    val authState: StateFlow<AuthState> = _authState

    private val _loginError = MutableStateFlow<String?>(null)
    val loginError: StateFlow<String?> = _loginError

    private val _loading = MutableStateFlow(false)
    val loading: StateFlow<Boolean> = _loading

    init { restoreSession() }

    private fun restoreSession() {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            _authState.value = when (val result = repo.restoreSession()) {
                is AuthResult.Success -> AuthState.Authenticated(result.data)
                is AuthResult.Error   -> AuthState.Unauthenticated
            }
        }
    }

    fun login(email: String, password: String) {
        if (_loading.value) return
        viewModelScope.launch {
            _loading.value = true
            _loginError.value = null
            when (val result = repo.login(email, password)) {
                is AuthResult.Success -> _authState.value = AuthState.Authenticated(result.data)
                is AuthResult.Error   -> _loginError.value = result.message
            }
            _loading.value = false
        }
    }

    fun logout() {
        viewModelScope.launch {
            repo.logout()
            _authState.value = AuthState.Unauthenticated
        }
    }

    fun clearLoginError() { _loginError.value = null }
}
