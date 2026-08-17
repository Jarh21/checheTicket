package com.passnet.wifi.ui.components

import androidx.lifecycle.ViewModel
import com.passnet.wifi.data.printer.BluetoothPrinterManager
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject

@HiltViewModel
class TicketModalViewModel @Inject constructor(
    val printerManager: BluetoothPrinterManager,
) : ViewModel()
