package com.passnet.wifi.ui.auth

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.input.*
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.passnet.wifi.data.repository.AuthRepository
import com.passnet.wifi.data.repository.AuthResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ResetPasswordViewModel @Inject constructor(
    private val repo: AuthRepository,
) : androidx.lifecycle.ViewModel() {
    private val _loading = MutableStateFlow(false)
    val loading: StateFlow<Boolean> = _loading
    private val _message = MutableStateFlow<String?>(null)
    val message: StateFlow<String?> = _message
    private val _success = MutableStateFlow(false)
    val success: StateFlow<Boolean> = _success

    fun reset(token: String, password: String) {
        if (_loading.value) return
        viewModelScope.launch {
            _loading.value = true
            when (val r = repo.resetPassword(token, password)) {
                is AuthResult.Success -> { _message.value = r.data; _success.value = true }
                is AuthResult.Error   -> _message.value = r.message
            }
            _loading.value = false
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ResetPasswordScreen(
    token: String,
    onDone: () -> Unit,
    vm: ResetPasswordViewModel = hiltViewModel(),
) {
    val loading by vm.loading.collectAsState()
    val message by vm.message.collectAsState()
    val success by vm.success.collectAsState()
    var password    by remember { mutableStateOf("") }
    var showPass    by remember { mutableStateOf(false) }
    val focus       = LocalFocusManager.current

    LaunchedEffect(success) { if (success) onDone() }

    Scaffold(topBar = { TopAppBar(title = { Text("Nueva contraseña") }) }) { padding ->
        Column(
            modifier = Modifier.fillMaxWidth().padding(padding).padding(24.dp)
        ) {
            Text(
                "Ingresa tu nueva contraseña.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(20.dp))
            OutlinedTextField(
                value            = password,
                onValueChange    = { password = it },
                label            = { Text("Nueva contraseña") },
                singleLine       = true,
                modifier         = Modifier.fillMaxWidth(),
                visualTransformation = if (showPass) VisualTransformation.None else PasswordVisualTransformation(),
                keyboardOptions  = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done),
                keyboardActions  = KeyboardActions(onDone = { focus.clearFocus(); vm.reset(token, password) }),
                trailingIcon     = {
                    IconButton(onClick = { showPass = !showPass }) {
                        Icon(
                            if (showPass) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                            contentDescription = null,
                        )
                    }
                }
            )
            Spacer(Modifier.height(16.dp))
            Button(
                onClick  = { focus.clearFocus(); vm.reset(token, password) },
                modifier = Modifier.fillMaxWidth().height(50.dp),
                enabled  = password.length >= 6 && !loading,
            ) {
                if (loading) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp, color = MaterialTheme.colorScheme.onPrimary)
                else Text("Cambiar contraseña")
            }
            if (message != null) {
                Spacer(Modifier.height(12.dp))
                Text(message!!, style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}
