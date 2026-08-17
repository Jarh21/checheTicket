package com.passnet.wifi.ui.theme

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary            = PassnetRed,
    onPrimary          = Color.White,
    primaryContainer   = PassnetRedContainer,
    onPrimaryContainer = PassnetRedOnContainer,

    secondary          = Color(0xFF888888),
    onSecondary        = Color.White,

    background         = Background,
    onBackground       = OnBackground,

    surface            = Surface,
    onSurface          = OnSurface,
    surfaceVariant     = SurfaceVariant,
    onSurfaceVariant   = OnSurfaceVariant,

    error              = Error,
    onError            = Color.White,
    errorContainer     = ErrorContainer,

    outline            = Color(0xFF444444),
    outlineVariant     = Color(0xFF333333),
)

@Composable
fun PassnetWifiTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography  = PassnetTypography,
        content     = content,
    )
}
