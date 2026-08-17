package com.passnet.wifi.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.*
import com.passnet.wifi.R
import com.passnet.wifi.domain.model.AuthState
import com.passnet.wifi.ui.auth.*
import com.passnet.wifi.ui.dashboard.DashboardScreen
import com.passnet.wifi.ui.history.HistoryScreen
import com.passnet.wifi.ui.plans.PlansScreen
import com.passnet.wifi.ui.settings.SettingsScreen

private data class BottomNavItem(
    val screen: Screen,
    val label: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector,
)

@Composable
fun AppNavigation(authState: AuthState, onDeepLinkToken: String?) {
    val navController = rememberNavController()

    val startDestination = when (authState) {
        is AuthState.Authenticated -> Screen.Dashboard.route
        else                       -> Screen.Login.route
    }

    val bottomItems = listOf(
        BottomNavItem(Screen.Dashboard, "Panel",    Icons.Default.Home),
        BottomNavItem(Screen.Plans,     "Planes",   Icons.Default.Star),
        BottomNavItem(Screen.History,   "Historial",Icons.Default.History),
        BottomNavItem(Screen.Settings,  "Ajustes",  Icons.Default.Settings),
    )

    val bottomRoutes = bottomItems.map { it.screen.route }.toSet()
    val currentEntry by navController.currentBackStackEntryAsState()
    val currentRoute = currentEntry?.destination?.route
    val showBottomBar = currentRoute in bottomRoutes

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                NavigationBar {
                    bottomItems.forEach { item ->
                        val selected = currentEntry?.destination?.hierarchy
                            ?.any { it.route == item.screen.route } == true
                        NavigationBarItem(
                            icon     = { Icon(item.icon, contentDescription = item.label) },
                            label    = { Text(item.label) },
                            selected = selected,
                            onClick  = {
                                navController.navigate(item.screen.route) {
                                    popUpTo(navController.graph.findStartDestination().id) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState    = true
                                }
                            }
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController    = navController,
            startDestination = startDestination,
            modifier         = Modifier.padding(innerPadding),
        ) {
            composable(Screen.Login.route) {
                LoginScreen(
                    onLoginSuccess     = {
                        navController.navigate(Screen.Dashboard.route) {
                            popUpTo(Screen.Login.route) { inclusive = true }
                        }
                    },
                    onForgotPassword   = { navController.navigate(Screen.ForgotPassword.route) },
                )
            }
            composable(Screen.ForgotPassword.route) {
                ForgotPasswordScreen(onBack = { navController.popBackStack() })
            }
            composable(Screen.ResetPassword.route) { backEntry ->
                val token = backEntry.arguments?.getString("token") ?: ""
                ResetPasswordScreen(
                    token  = token,
                    onDone = {
                        navController.navigate(Screen.Login.route) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }
            composable(Screen.Dashboard.route) {
                DashboardScreen(
                    onLogout = {
                        navController.navigate(Screen.Login.route) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }
            composable(Screen.Plans.route)    { PlansScreen() }
            composable(Screen.History.route)  { HistoryScreen() }
            composable(Screen.Settings.route) {
                SettingsScreen(
                    onLogout = {
                        navController.navigate(Screen.Login.route) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }
        }
    }

    // Handle deep link for password reset (tuticketwifi://reset-password?token=...)
    LaunchedEffect(onDeepLinkToken) {
        if (!onDeepLinkToken.isNullOrBlank()) {
            navController.navigate(Screen.ResetPassword.withToken(onDeepLinkToken))
        }
    }
}
