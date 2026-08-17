package com.passnet.wifi.data.printer

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothSocket
import android.content.Context
import android.util.Base64
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.IOException
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

data class BluetoothPrinterInfo(
    val address: String,
    val name: String,
)

sealed class PrintResult {
    object Success : PrintResult()
    data class Error(val message: String) : PrintResult()
}

@Singleton
class BluetoothPrinterManager @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    // SPP UUID — standard Serial Port Profile for all ESC/POS printers
    private val SPP_UUID: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")

    private var socket: BluetoothSocket? = null

    private fun getAdapter(): BluetoothAdapter? {
        val bm = context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
        return bm?.adapter
    }

    fun isBluetoothEnabled(): Boolean = getAdapter()?.isEnabled == true

    /** Returns all paired Bluetooth devices (no scanning required). */
    fun getPairedPrinters(): List<BluetoothPrinterInfo> {
        val adapter = getAdapter() ?: return emptyList()
        if (!adapter.isEnabled) return emptyList()
        return adapter.bondedDevices.map { device ->
            BluetoothPrinterInfo(
                address = device.address,
                name    = device.name ?: "Desconocido",
            )
        }
    }

    /** Connect to a printer by MAC address and print base64-encoded ESC/POS data. */
    suspend fun print(printerAddress: String, base64Data: String): PrintResult =
        withContext(Dispatchers.IO) {
            val adapter = getAdapter()
                ?: return@withContext PrintResult.Error("Bluetooth no disponible en este dispositivo")

            if (!adapter.isEnabled)
                return@withContext PrintResult.Error("El Bluetooth está apagado. Actívalo e intenta de nuevo.")

            val device = try {
                adapter.getRemoteDevice(printerAddress)
            } catch (e: IllegalArgumentException) {
                return@withContext PrintResult.Error("Dirección MAC inválida: $printerAddress")
            }

            // Reuse existing connection if same device
            val currentSocket = socket
            if (currentSocket == null || !currentSocket.isConnected ||
                currentSocket.remoteDevice.address != printerAddress) {
                try {
                    socket?.close()
                    socket = null
                } catch (_: IOException) {}

                socket = try {
                    device.createRfcommSocketToServiceRecord(SPP_UUID).also { it.connect() }
                } catch (e: IOException) {
                    return@withContext PrintResult.Error(
                        "No se pudo conectar con la impresora ${device.name ?: printerAddress}: ${e.message}"
                    )
                }
            }

            val activeSocket = socket ?: return@withContext PrintResult.Error("Error interno de conexión")

            return@withContext try {
                val bytes = Base64.decode(base64Data, Base64.DEFAULT)
                activeSocket.outputStream.write(bytes)
                activeSocket.outputStream.flush()
                PrintResult.Success
            } catch (e: IllegalArgumentException) {
                PrintResult.Error("Datos de impresión inválidos: ${e.message}")
            } catch (e: IOException) {
                // Socket may be broken; clear it for next attempt
                try { socket?.close() } catch (_: IOException) {}
                socket = null
                PrintResult.Error("Error al enviar datos a la impresora: ${e.message}")
            }
        }

    fun disconnect() {
        try { socket?.close() } catch (_: IOException) {}
        socket = null
    }
}
