import { Ticket } from '@/types';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function generateTicketHtml(ticket: Ticket, wifiName: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Courier New', monospace; font-size: 13px; width: 220px; padding: 8px; color: #000; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .big { font-size: 16px; font-weight: bold; letter-spacing: 2px; }
  .dashes { border-top: 1px dashed #000; margin: 6px 0; }
  h3 { text-align: center; font-size: 14px; margin-bottom: 6px; letter-spacing: 1px; }
  .row { display: flex; justify-content: space-between; margin: 2px 0; }
  .user-box { text-align: center; margin: 6px 0; padding: 6px; border: 1px solid #000; }
  .footer { text-align: center; font-size: 11px; margin-top: 4px; }
</style>
</head><body>
  <h3>INTERNET HOTSPOT</h3>
  <div class="dashes"></div>
  <div class="user-box">
    <div style="font-size:11px">USUARIO</div>
    <div class="big">${ticket.username}</div>
    <div style="font-size:11px;margin-top:4px">CLAVE</div>
    <div class="big">${ticket.password}</div>
  </div>
  <div class="dashes"></div>
  <div class="row"><span>Plan:</span><span class="bold">${ticket.planName}</span></div>
  <div class="row"><span>Duración:</span><span>${ticket.durationLabel}</span></div>
  <div class="row"><span>Precio:</span><span class="bold">$${ticket.price.toFixed(2)}</span></div>
  <div class="dashes"></div>
  <div class="row"><span>Inicio:</span><span>${formatDate(ticket.createdAt)}</span></div>
  <div class="row"><span>Expira:</span><span>${formatDate(ticket.expiresAt)}</span></div>
  <div class="dashes"></div>
  <div class="center bold">Red WiFi: ${wifiName}</div>
  <div class="dashes"></div>
  <div class="footer">Gracias por su preferencia</div>
</body></html>`;
}

export function generateTicketText(ticket: Ticket, wifiName: string): string {
  const line = '================================';
  const dash = '--------------------------------';
  return `${line}
      INTERNET HOTSPOT
${line}
USUARIO: ${ticket.username}
CLAVE:   ${ticket.password}
${dash}
Plan:    ${ticket.planName}
Duracion:${ticket.durationLabel}
Precio:  $${ticket.price.toFixed(2)}
${dash}
Inicio:  ${formatDate(ticket.createdAt)}
Expira:  ${formatDate(ticket.expiresAt)}
${line}
  Red WiFi: ${wifiName}
${line}
   Gracias por su preferencia
${line}
`;
}

export async function printTicket(
  ticket: Ticket,
  wifiName: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await Print.printAsync({ html: generateTicketHtml(ticket, wifiName) });
    return { success: true };
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message?.toLowerCase().includes('cancel')) return { success: true };
    return { success: false, error: e.message };
  }
}

export async function shareTicket(ticket: Ticket, wifiName: string): Promise<void> {
  try {
    const text = generateTicketText(ticket, wifiName);
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) return;
    const uri = `${FileSystem.documentDirectory}ticket_${ticket.username}.txt`;
    await FileSystem.writeAsStringAsync(uri, text, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    await Sharing.shareAsync(uri, {
      mimeType: 'text/plain',
      dialogTitle: 'Compartir Ticket',
    });
  } catch {
    // Silently fail — sharing is optional
  }
}
