package com.passnet.wifi

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.runtime.*
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.passnet.wifi.domain.model.AuthState
import com.passnet.wifi.navigation.AppNavigation
import com.passnet.wifi.ui.auth.AuthViewModel
import com.passnet.wifi.ui.theme.PassnetWifiTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    private val authViewModel: AuthViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        // Install the splash screen before super.onCreate()
        val splashScreen = installSplashScreen()

        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Keep the splash visible while restoring the session
        splashScreen.setKeepOnScreenCondition {
            authViewModel.authState.value == AuthState.Loading
        }

        // Extract deep-link token if the app was opened via tuticketwifi://reset-password?token=...
        val deepLinkToken = intent?.data
            ?.takeIf { it.scheme == "tuticketwifi" && it.host == "reset-password" }
            ?.getQueryParameter("token")

        setContent {
            PassnetWifiTheme {
                val authState by authViewModel.authState.collectAsState()

                // Don't render the app until session check is complete
                if (authState != AuthState.Loading) {
                    AppNavigation(
                        authState        = authState,
                        onDeepLinkToken  = deepLinkToken,
                    )
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        // Deep links arriving while the app is already open are handled by
        // AppNavigation via a LaunchedEffect on the token — no action needed here.
    }
}
