package com.passnet.wifi.data.printer

import android.util.Base64

/**
 * ESC/POS command builder for 58 mm thermal printers.
 * Outputs a Base64-encoded string ready to send over Bluetooth.
 */
object EscPosCommands {

    // Basic ESC/POS byte constants
    private const val ESC = 0x1B.toByte()
    private const val GS  = 0x1D.toByte()
    private const val LF  = 0x0A.toByte()

    private val INIT           = byteArrayOf(ESC, 0x40)
    private val BOLD_ON        = byteArrayOf(ESC, 0x45, 0x01)
    private val BOLD_OFF       = byteArrayOf(ESC, 0x45, 0x00)
    private val ALIGN_LEFT     = byteArrayOf(ESC, 0x61, 0x00)
    private val ALIGN_CENTER   = byteArrayOf(ESC, 0x61, 0x01)
    private val SIZE_NORMAL    = byteArrayOf(GS,  0x21, 0x00)
    private val SIZE_DOUBLE    = byteArrayOf(GS,  0x21, 0x11) // width+height x2
    private val CUT            = byteArrayOf(GS,  0x56, 0x42, 0x00)

    private fun text(str: String): ByteArray = str.toByteArray(Charsets.ISO_8859_1)
    private fun newLine(n: Int = 1): ByteArray = ByteArray(n) { LF }
    private fun dashes(): ByteArray = text("--------------------------------\n")

    /**
     * Build the complete ESC/POS byte sequence for a ticket and return it
     * as a Base64 string (for transmission over Bluetooth).
     */
    fun buildTicketBase64(
        username: String,
        password: String,
        planName: String,
        durationLabel: String,
        price: Double,
        createdAt: String,
        expiresAt: String,
        wifiName: String,
    ): String {
        val parts = mutableListOf<ByteArray>()

        fun add(vararg arrays: ByteArray) = arrays.forEach { parts.add(it) }

        add(INIT)
        add(ALIGN_CENTER, BOLD_ON, SIZE_DOUBLE, text("INTERNET HOTSPOT\n"), SIZE_NORMAL, BOLD_OFF)
        add(dashes())

        // Username and password box
        add(ALIGN_CENTER, BOLD_ON, text("USUARIO\n"), SIZE_DOUBLE, text("$username\n"), SIZE_NORMAL, BOLD_OFF)
        add(ALIGN_CENTER, BOLD_ON, text("CLAVE\n"),   SIZE_DOUBLE, text("$password\n"), SIZE_NORMAL, BOLD_OFF)
        add(dashes())

        // Plan details (left-aligned two-column rows)
        add(ALIGN_LEFT)
        add(justifyRow("Plan:",     planName))
        add(justifyRow("Duracion:", durationLabel))
        add(justifyRow("Precio:",   "$${"%.2f".format(price)}"))
        add(dashes())
        add(justifyRow("Inicio:",   createdAt))
        add(justifyRow("Expira:",   expiresAt))
        add(dashes())

        // Footer
        add(ALIGN_CENTER, BOLD_ON, text("Red WiFi: $wifiName\n"), BOLD_OFF)
        add(ALIGN_CENTER, text("Gracias por su preferencia\n"))
        add(dashes())
        add(newLine(3))
        add(CUT)

        val allBytes = parts.fold(ByteArray(0)) { acc, b -> acc + b }
        return Base64.encodeToString(allBytes, Base64.NO_WRAP)
    }

    /** Pad label + value to fill 32 chars on a 58 mm roll */
    private fun justifyRow(label: String, value: String): ByteArray {
        val line = 32
        val spaces = (line - label.length - value.length).coerceAtLeast(1)
        return text("$label${" ".repeat(spaces)}$value\n")
    }

    /** Plain text representation (for sharing via Android Sharesheet) */
    fun buildTicketText(
        username: String,
        password: String,
        planName: String,
        durationLabel: String,
        price: Double,
        createdAt: String,
        expiresAt: String,
        wifiName: String,
    ): String {
        val line = "================================"
        val dash = "--------------------------------"
        return buildString {
            appendLine(line)
            appendLine("        INTERNET HOTSPOT")
            appendLine(line)
            appendLine("USUARIO:  $username")
            appendLine("CLAVE:    $password")
            appendLine(dash)
            appendLine("Plan:     $planName")
            appendLine("Duracion: $durationLabel")
            appendLine("Precio:   $${"%.2f".format(price)}")
            appendLine(dash)
            appendLine("Inicio:   $createdAt")
            appendLine("Expira:   $expiresAt")
            appendLine(line)
            appendLine("   Red WiFi: $wifiName")
            appendLine(line)
            appendLine("   Gracias por su preferencia")
            appendLine(line)
        }
    }

    /** Build hotspot portal HTML with business name and brand color */
    fun buildPortalHtml(businessName: String, primaryColor: String): String = """
        <!DOCTYPE html>
        <html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width">
        <title>${escHtml(businessName)}</title>
        <style>
          body{background:#111;color:#eee;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
          .card{background:#1a1a1a;border-radius:12px;padding:32px 24px;width:320px;text-align:center}
          h2{color:${escHtml(primaryColor)};margin-bottom:8px}
          input{width:100%;padding:10px;margin:8px 0;background:#252525;color:#fff;border:1px solid #444;border-radius:6px;box-sizing:border-box}
          button{width:100%;padding:12px;background:${escHtml(primaryColor)};color:#fff;border:none;border-radius:6px;font-size:16px;cursor:pointer;margin-top:8px}
          .powered{font-size:11px;color:#555;margin-top:12px}
        </style></head>
        <body><div class="card">
          <h2>${escHtml(businessName)}</h2>
          <p style="color:#aaa;font-size:14px">Internet Hotspot</p>
          <form name="sendin" action="\$(link-login-only)" method="post">
            <input type="hidden" name="dst" value="\$(link-orig)">
            <input type="text" name="username" placeholder="Usuario" autocomplete="off">
            <input type="password" name="password" placeholder="Contraseña">
            <button type="submit">Conectar</button>
          </form>
          <div class="powered">PASSNET WIFI</div>
        </div></body></html>
    """.trimIndent()

    private fun escHtml(s: String) = s
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;")
}
