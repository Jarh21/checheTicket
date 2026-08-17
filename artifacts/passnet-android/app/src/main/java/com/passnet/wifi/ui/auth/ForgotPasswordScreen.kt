package com.passnet.wifi.ui.auth

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
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
class ForgotPasswordViewModel @Inject constructor(
    private val repo: AuthRepository,
) : androidx.lifecycle.ViewModel() {
    private val _loading = MutableStateFlow(false)
    val loading: StateFlow<Boolean> = _loading
    private val _result = MutableStateFlow<String?>(null)
    val result: StateFlow<String?> = _result

    fun send(email: String) {
        if (_loading.value) return
        viewModelScope.launch {
            _loading.value = true
            _result.value = when (val r = repo.forgotPassword(email)) {
                is AuthResult.Success -> "✓ Instrucciones enviadas a $email"
                is AuthResult.Error   -> "Error: ${r.message}"
            }
            _loading.value = false
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ForgotPasswordScreen(
    onBack: () -> Unit,
    vm: ForgotPasswordViewModel = hiltViewModel(),
) {
    val loading by vm.loading.collectAsState()
    val result  by vm.result.collectAsState()
    var email   by remember { mutableStateOf("") }
    val focus   = LocalFocusManager.current

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Recuperar contraseña") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(padding)
                .padding(24.dp)
        ) {
            Text(
                "Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(20.dp))
            OutlinedTextField(
                value         = email,
                onValueChange = { email = it },
                label         = { Text("Correo electrónico") },
                singleLine    = true,
                modifier      = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Email,
                    imeAction    = ImeAction.Done,
                ),
                keyboardActions = KeyboardActions(
                    onDone = { focus.clearFocus(); vm.send(email) }
                ),
            )
            Spacer(Modifier.height(16.dp))
            Button(
                onClick  = { focus.clearFocus(); vm.send(email) },
                modifier = Modifier.fillMaxWidth().height(50.dp),
                enabled  = email.isNotBlank() && !loading,
            ) {
                if (loading) CircularProgressIndicator(
                    modifier    = Modifier.size(20.dp),
                    strokeWidth = 2.dp,
                    color       = MaterialTheme.colorScheme.onPrimary,
                )
                else Text("Enviar instrucciones")
            }
            if (result != null) {
                Spacer(Modifier.height(16.dp))
                Text(result!!, style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}
