package com.passnet.wifi.ui.auth

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.input.*
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.passnet.wifi.ui.theme.PassnetRed

@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    onForgotPassword: () -> Unit,
    vm: AuthViewModel = hiltViewModel(),
) {
    val loading by vm.loading.collectAsState()
    val error   by vm.loginError.collectAsState()
    val auth    by vm.authState.collectAsState()

    var email    by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var showPass by remember { mutableStateOf(false) }

    val focusManager = LocalFocusManager.current

    // Navigate on successful auth
    LaunchedEffect(auth) {
        if (auth is com.passnet.wifi.domain.model.AuthState.Authenticated) onLoginSuccess()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 28.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Spacer(Modifier.height(48.dp))

        // Logo / brand
        Text(
            text  = "PASSNET WIFI",
            style = MaterialTheme.typography.headlineMedium,
            color = PassnetRed,
        )
        Text(
            text  = "Administrador de Hotspot",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        Spacer(Modifier.height(40.dp))

        // Email field
        OutlinedTextField(
            value         = email,
            onValueChange = { email = it; vm.clearLoginError() },
            label         = { Text("Correo electrónico") },
            singleLine    = true,
            modifier      = Modifier.fillMaxWidth(),
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Email,
                imeAction    = ImeAction.Next,
            ),
            keyboardActions = KeyboardActions(
                onNext = { focusManager.moveFocus(FocusDirection.Down) }
            ),
        )

        Spacer(Modifier.height(12.dp))

        // Password field
        OutlinedTextField(
            value         = password,
            onValueChange = { password = it; vm.clearLoginError() },
            label         = { Text("Contraseña") },
            singleLine    = true,
            modifier      = Modifier.fillMaxWidth(),
            visualTransformation = if (showPass) VisualTransformation.None else PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Password,
                imeAction    = ImeAction.Done,
            ),
            keyboardActions = KeyboardActions(
                onDone = {
                    focusManager.clearFocus()
                    vm.login(email, password)
                }
            ),
            trailingIcon = {
                IconButton(onClick = { showPass = !showPass }) {
                    Icon(
                        imageVector = if (showPass) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                        contentDescription = if (showPass) "Ocultar contraseña" else "Mostrar contraseña",
                    )
                }
            }
        )

        // Error message
        if (error != null) {
            Spacer(Modifier.height(8.dp))
            Text(
                text  = error!!,
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall,
            )
        }

        Spacer(Modifier.height(24.dp))

        // Login button
        Button(
            onClick  = { focusManager.clearFocus(); vm.login(email, password) },
            modifier = Modifier.fillMaxWidth().height(50.dp),
            enabled  = email.isNotBlank() && password.isNotBlank() && !loading,
        ) {
            if (loading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(20.dp),
                    color    = MaterialTheme.colorScheme.onPrimary,
                    strokeWidth = 2.dp,
                )
            } else {
                Text("Iniciar sesión")
            }
        }

        Spacer(Modifier.height(12.dp))

        TextButton(onClick = onForgotPassword) {
            Text("¿Olvidaste tu contraseña?")
        }

        Spacer(Modifier.height(48.dp))
    }
}
