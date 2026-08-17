package com.passnet.wifi.navigation

sealed class Screen(val route: String) {
    object Login          : Screen("login")
    object ForgotPassword : Screen("forgot_password")
    object ResetPassword  : Screen("reset_password/{token}") {
        fun withToken(token: String) = "reset_password/$token"
    }
    object Dashboard      : Screen("dashboard")
    object Plans          : Screen("plans")
    object History        : Screen("history")
    object Settings       : Screen("settings")
}
