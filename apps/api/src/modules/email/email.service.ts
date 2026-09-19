import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>("smtp.host"),
      port: this.configService.get<number>("smtp.port"),
      secure: false,
      auth: {
        user: this.configService.get<string>("smtp.user"),
        pass: this.configService.get<string>("smtp.password"),
      },
    });
  }

  async send(options: SendMailOptions) {
    try {
      const info = await this.transporter.sendMail({
        from: this.configService.get<string>("smtp.from"),
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      this.logger.log(`Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      throw error;
    }
  }

  async sendOrderNotificationEmail(params: {
    to: string;
    customerName: string;
    siteName: string;
    orderId: string;
    orderUrl: string;
    total: string;
    discount?: string;
    currency?: string;
    paymentMethod: string;
    status: string;
    items: Array<{ name: string; quantity: number; price: number }>;
  }) {
    const paids = params.status === "paid";
    const methodLabel = params.paymentMethod === "paypal" ? "PayPal" : params.paymentMethod === "payphone" ? "Payphone (tarjeta / saldo)" : params.paymentMethod === "cod" ? "Pago contra entrega" : (params.paymentMethod || "—");
    const rows = params.items
      .map(
        (i) => `<tr style="border-bottom:1px solid #e2e8f0">
          <td style="padding:10px 8px;color:#0f172a">${i.quantity} × ${i.name}</td>
          <td style="padding:10px 8px;text-align:right;color:#0f172a">${this.formatMoney(i.price * i.quantity, params.currency)}</td>
        </tr>`
      )
      .join("");
    const discountRow = Number(params.discount || 0) > 0
      ? `<tr><td style="padding:8px;color:#16a34a">Descuento</td><td style="padding:8px;text-align:right;color:#16a34a">-${this.formatMoney(Number(params.discount), params.currency)}</td></tr>`
      : "";

    await this.send({
      to: params.to,
      subject: paids
        ? `Pago confirmado · Pedido ${String(params.orderId).slice(0, 8).toUpperCase()} · ${params.siteName}`
        : `Pedido recibido · ${String(params.orderId).slice(0, 8).toUpperCase()} · ${params.siteName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #0f172a;">
          <div style="background: ${paids ? "#16a34a" : "#2563EB"}; color: #fff; padding: 24px; border-radius: 8px 8px 0 0;">
            <h1 style="margin:0;font-size:20px;">${paids ? "✓ ¡Pago confirmado!" : "Tu pedido está en camino"}</h1>
            <p style="margin:6px 0 0;opacity:.9;font-size:14px;">${params.siteName}</p>
          </div>
          <div style="border:1px solid #e2e8f0; border-top:0; padding: 24px; border-radius: 0 0 8px 8px;">
            <p>Hola ${params.customerName || "cliente"},</p>
            ${paids ? `<p>Hemos recibido tu pago correctamente. Método: <strong>${methodLabel}</strong>.</p>` : `<p>Recibimos tu pedido. Forma de pago: <strong>${methodLabel}</strong> (${params.paymentMethod === "cod" ? "pagas al recibir" : "se procesó al confirmar"}).</p>`}
            <p style="color:#475569;font-size:14px;">Pedido <strong>#${String(params.orderId).slice(0, 8).toUpperCase()}</strong></p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
              <tbody>${rows}${discountRow}</tbody>
            </table>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-top:2px solid #0f172a">
              <strong>Total</strong>
              <strong style="font-size:18px;">${this.formatMoney(Number(params.total), params.currency)}</strong>
            </div>
            <a href="${params.orderUrl}" style="display:inline-block;background:${paids ? "#16a34a" : "#2563EB"};color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;margin-top:16px;">
              Ver mi pedido
            </a>
            <p style="color:#666;font-size:13px;margin-top:20px;">Si tienes dudas, responde este correo o contáctanos. Gracias por tu compra.</p>
          </div>
        </div>
      `,
    });
  }

  private formatMoney(value: number, currency = "USD") {
    try {
      return new Intl.NumberFormat("es-US", { style: "currency", currency }).format(value);
    } catch {
      return `$${Number(value).toFixed(2)}`;
    }
  }

  private getFrontendUrl(): string {
    return this.configService.get<string>("FRONTEND_URL", "https://build.icebergup.com");
  }

  get isConfigured(): boolean {
    const user = this.configService.get<string>("smtp.user");
    const pass = this.configService.get<string>("smtp.password");
    return Boolean(user && pass);
  }

  async sendVerificationEmail(to: string, code: string) {
    await this.send({
      to,
      subject: "Tu código de verificación - Plataforma",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563EB;">Verifica tu correo</h1>
          <p>Hola,</p>
          <p>Ingresa el siguiente código para confirmar tu dirección de correo y activar tu cuenta:</p>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 16px 0; text-align: center;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563EB;">${code}</span>
          </div>
          <p style="color: #666; font-size: 14px;">Este código expirará en 15 minutos. Si no solicitaste este registro, ignora este mensaje.</p>
        </div>
      `,
    });
  }

  async sendWelcomeEmail(to: string, name: string) {
    const dashboardUrl = `${this.getFrontendUrl()}/dashboard`;
    await this.send({
      to,
      subject: "Bienvenido a Plataforma",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563EB;">¡Bienvenido a Plataforma!</h1>
          <p>Hola ${name},</p>
          <p>Gracias por registrarte en Plataforma. Estamos emocionados de ayudarte a construir tu presencia digital.</p>
          <p>Con Plataforma puedes:</p>
          <ul>
            <li>Crear sitios web profesionales sin código</li>
            <li>Capturar leads con formularios inteligentes</li>
            <li>Monitorear el rendimiento de tu negocio</li>
          </ul>
          <p>Comienza ahora y crea tu primer sitio web.</p>
          <a href="${dashboardUrl}" style="display: inline-block; background: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
            Ir al dashboard
          </a>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const resetUrl = `${this.getFrontendUrl()}/reset-password?token=${token}`;
    await this.send({
      to,
      subject: "Recuperación de contraseña - Plataforma",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563EB;">Recuperación de contraseña</h1>
          <p>Has solicitado restablecer tu contraseña.</p>
          <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
          <a href="${resetUrl}" style="display: inline-block; background: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
            Restablecer contraseña
          </a>
          <p style="color: #666; font-size: 14px;">Este enlace expirará en 1 hora. Si no solicitaste este cambio, ignora este mensaje.</p>
        </div>
      `,
    });
  }
}
