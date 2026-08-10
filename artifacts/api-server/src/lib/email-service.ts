import nodemailer from "nodemailer";

export async function sendPasswordResetEmail(
  toEmail: string,
  resetToken: string,
  config: { gmailUser: string; gmailAppPassword: string },
): Promise<void> {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: config.gmailUser,
      pass: config.gmailAppPassword,
    },
  });

  const resetLink = `tuticketwifi://reset-password?token=${resetToken}`;

  await transporter.sendMail({
    from: `"HotSpot Manager" <${config.gmailUser}>`,
    to: toEmail,
    subject: "Restablecer contraseña - HotSpot Manager",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #f9fafb; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background: #2563eb; border-radius: 12px; padding: 14px 20px;">
            <span style="color: white; font-size: 20px; font-weight: bold;">📡 HotSpot Manager</span>
          </div>
        </div>
        <div style="background: white; border-radius: 12px; padding: 32px; border: 1px solid #e5e7eb;">
          <h2 style="margin: 0 0 8px; color: #111827; font-size: 22px;">Restablecer contraseña</h2>
          <p style="margin: 0 0 24px; color: #6b7280; font-size: 15px;">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta.
            Toca el botón desde tu teléfono Android para continuar.
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetLink}"
               style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px;
                      border-radius: 10px; text-decoration: none; font-size: 16px; font-weight: 600;">
              Restablecer contraseña
            </a>
          </div>
          <p style="margin: 24px 0 0; color: #9ca3af; font-size: 13px; text-align: center;">
            Este enlace vence en <strong>1 hora</strong>.<br>
            Si no solicitaste esto, ignora este correo.
          </p>
        </div>
        <p style="margin: 16px 0 0; color: #d1d5db; font-size: 11px; text-align: center;">
          HotSpot Manager · Sistema de administración MikroTik
        </p>
      </div>
    `,
  });
}
