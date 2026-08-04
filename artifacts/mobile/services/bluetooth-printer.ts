import { PermissionsAndroid, Platform } from 'react-native';
import { Ticket } from '@/types';

export type BluetoothPrinter = {
  id: string;
  name: string;
  rssi?: number;
};

interface BluetoothPrinterModule {
  isBluetoothEnabled: () => boolean;
  requestEnableBluetooth: () => Promise<boolean>;
  getPairedDevices: () => Promise<BluetoothPrinter[]>;
  connectDevice: (deviceId: string) => Promise<boolean>;
  getConnectedDevice: () => BluetoothPrinter | null;
  printRaw: (base64Data: string) => Promise<boolean>;
}

type EscPosApi = typeof import('rn-bluetooth-classic-printer')['EscPos'];

interface BluetoothPrinterPackage {
  default: BluetoothPrinterModule;
  EscPos: EscPosApi;
}

function getBluetoothPackage(): BluetoothPrinterPackage | null {
  if (Platform.OS !== 'android') return null;

  try {
    // The native module is absent in Expo Go. Keep this lookup lazy so the
    // rest of the app remains usable while testing the UI there.
    return require('rn-bluetooth-classic-printer') as BluetoothPrinterPackage;
  } catch {
    return null;
  }
}

export function isBluetoothPrinterAvailable(): boolean {
  return getBluetoothPackage() !== null;
}

export async function getPairedBluetoothPrinters(): Promise<{
  success: boolean;
  printers: BluetoothPrinter[];
  error?: string;
}> {
  const pkg = getBluetoothPackage();
  if (!pkg) {
    return {
      success: false,
      printers: [],
      error: Platform.OS === 'ios'
        ? 'La impresión Bluetooth directa está disponible solo en Android.'
        : 'La impresión Bluetooth requiere el APK personalizado, no Expo Go.',
    };
  }

  try {
    const permissions = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);
    const hasPermissions =
      permissions[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
      permissions[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED;
    if (!hasPermissions) {
      return { success: false, printers: [], error: 'Permisos Bluetooth no concedidos.' };
    }

    const enabled = pkg.default.isBluetoothEnabled();
    if (!enabled) {
      await pkg.default.requestEnableBluetooth();
    }
    const printers = await pkg.default.getPairedDevices();
    return { success: true, printers };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'No se pudieron leer las impresoras emparejadas.';
    return { success: false, printers: [], error: message };
  }
}

export function generateBluetoothTicketCommands(ticket: Ticket, wifiName: string): string {
  const { EscPos: commands } = getBluetoothPackage() as BluetoothPrinterPackage;
  const line = commands.horizontalLine('normal');

  return commands.combineCommands(
    commands.INIT,
    commands.setTextSize(commands.TextSize.DOUBLE_BOTH),
    commands.textCenter('INTERNET HOTSPOT\n'),
    commands.setTextSize(commands.TextSize.NORMAL),
    line,
    commands.BOLD_ON,
    commands.textCenter('USUARIO\n'),
    commands.setTextSize(commands.TextSize.DOUBLE_BOTH),
    commands.textCenter(`${ticket.username}\n`),
    commands.setTextSize(commands.TextSize.NORMAL),
    commands.textCenter('CLAVE\n'),
    commands.setTextSize(commands.TextSize.DOUBLE_BOTH),
    commands.textCenter(`${ticket.password}\n`),
    commands.setTextSize(commands.TextSize.NORMAL),
    commands.BOLD_OFF,
    line,
    commands.printJustify('Plan:', ticket.planName),
    commands.printJustify('Duracion:', ticket.durationLabel),
    commands.printJustify('Precio:', `$${ticket.price.toFixed(2)}`),
    line,
    commands.printJustify('Inicio:', formatPrinterDate(ticket.createdAt)),
    commands.printJustify('Expira:', formatPrinterDate(ticket.expiresAt)),
    line,
    commands.textCenter(`Red WiFi: ${wifiName}\n`),
    commands.textCenter('Gracias por su preferencia\n'),
    commands.newLine(3),
    commands.cut(),
  );
}

function formatPrinterDate(iso: string): string {
  return new Date(iso).toLocaleString('es', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export async function printTicketBluetooth(
  ticket: Ticket,
  wifiName: string,
  printer: BluetoothPrinter,
): Promise<{ success: boolean; error?: string }> {
  const pkg = getBluetoothPackage();
  if (!pkg) {
    return {
      success: false,
      error: 'La impresión Bluetooth requiere el APK personalizado de la aplicación.',
    };
  }

  try {
    const connected = pkg.default.getConnectedDevice();
    if (!connected || connected.id !== printer.id) {
      const didConnect = await pkg.default.connectDevice(printer.id);
      if (!didConnect) {
        return { success: false, error: `No se pudo conectar con ${printer.name || printer.id}.` };
      }
    }

    const sent = await pkg.default.printRaw(generateBluetoothTicketCommands(ticket, wifiName));
    return sent
      ? { success: true }
      : { success: false, error: 'La impresora no aceptó el ticket.' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'No se pudo imprimir por Bluetooth.';
    return { success: false, error: message };
  }
}