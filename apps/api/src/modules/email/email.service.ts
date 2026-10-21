import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import { PlatformService } from "../platform/platform.service";

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

type TrialStage = "day1" | "day2" | "expired" | "expired3" | "expired7";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    private platformService: PlatformService
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>("smtp.host"),
      port: this.configService.get<number>("smtp.port"),
      secure: this.configService.get<boolean>("smtp.secure") === true,
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
      subject: `${code} es tu código de acceso - Plataforma`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563EB;">Tu código de acceso</h1>
          <p>Hola,</p>
          <p>Ingresa el siguiente código para continuar en la plataforma:</p>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 16px 0; text-align: center;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563EB;">${code}</span>
          </div>
          <p style="color: #666; font-size: 14px;">Este código expirará en 15 minutos. Si no solicitaste este registro, ignora este mensaje.</p>
        </div>
      `,
    });
  }

  async sendWelcomeEmail(params: { to: string; name?: string; tenantName?: string }) {
    const branding = await this.getBranding();
    const frontend = this.getFrontendUrl();
    const safeName = this.escapeHtml(params.name || "hola");
    const tenantName = this.escapeHtml(params.tenantName || "tu negocio");

    const html = this.renderEmailLayout({
      branding,
      title: "Tu prueba de 3 días ha comenzado",
      body: `
        <p style="margin:0 0 14px">Hola ${safeName},</p>
        <p style="margin:0 0 14px">Tu cuenta de <strong>${tenantName}</strong> ya está lista. Durante los próximos 3 días puedes probar el editor, las plantillas y las herramientas para hacer crecer tu negocio.</p>
        <ul style="margin:0 0 18px;padding-left:18px">
          <li style="margin-bottom:6px">Crea tu sitio web con una plantilla profesional.</li>
          <li style="margin-bottom:6px">Publica y comparte tu enlace.</li>
          <li>Recibe leads y revisa tus estadísticas.</li>
        </ul>
        <p style="margin:0">Cuando quieras seguir después de la prueba, elige el plan que mejor se adapte a ti.</p>
      `,
      ctaLabel: "Ir a mi panel",
      ctaUrl: `${frontend}/dashboard`,
      secondaryLabel: "Ver planes",
      secondaryUrl: `${frontend}/dashboard/billing`,
    });

    await this.send({
      to: params.to,
      subject: "Bienvenido a Plataforma: tu prueba de 3 días",
      html,
    });
  }

  async sendTrialCampaignEmail(params: {
    to: string;
    name?: string;
    tenantName?: string;
    stage: TrialStage;
  }) {
    const branding = await this.getBranding();
    const frontend = this.getFrontendUrl();
    const safeName = this.escapeHtml(params.name || "hola");
    const tenantName = this.escapeHtml(params.tenantName || "tu negocio");

    let subject = "";
    let title = "";
    let body = "";
    let ctaLabel = "";
    let ctaPath = "/dashboard/billing";
    let secondaryLabel: string | undefined;
    let secondaryPath: string | undefined;

    switch (params.stage) {
      case "day1":
        subject = "Tu prueba está activa: crea tu primer sitio";
        title = "Aprovecha tu prueba de 3 días";
        body = `<p style="margin:0 0 14px">Hola ${safeName},</p><p style="margin:0 0 14px">Ya llevas un día de prueba en <strong>${tenantName}</strong>. El siguiente paso es crear tu sitio web: elige una plantilla, personalízala y publícala en minutos.</p><p style="margin:0">Todo lo que construyas durante la prueba queda guardado.</p>`;
        ctaLabel = "Ir a mi panel";
        ctaPath = "/dashboard";
        secondaryLabel = "Ver planes";
        secondaryPath = "/dashboard/billing";
        break;
      case "day2":
        subject = "Tu prueba termina mañana";
        title = "Tu prueba termina mañana";
        body = `<p style="margin:0 0 14px">Hola ${safeName},</p><p style="margin:0 0 14px">Tu prueba de <strong>${tenantName}</strong> termina mañana. Elige un plan para mantener tu sitio, tus leads y tu panel activos sin interrupciones.</p><p style="margin:0">Puedes seguir desde donde lo dejaste.</p>`;
        ctaLabel = "Elegir un plan";
        ctaPath = "/dashboard/billing";
        secondaryLabel = "Ir a mi panel";
        secondaryPath = "/dashboard";
        break;
      case "expired":
        subject = "Tu prueba terminó: reactiva tu cuenta";
        title = "Tu prueba terminó";
        body = `<p style="margin:0 0 14px">Hola ${safeName},</p><p style="margin:0 0 14px">El panel de <strong>${tenantName}</strong> está en pausa. Tus datos y tu sitio siguen guardados; elige un plan para volver a entrar y retomarlo.</p>`;
        ctaLabel = "Reactivar cuenta";
        break;
      case "expired3":
        subject = "Tu sitio te está esperando";
        title = "Tu sitio te está esperando";
        body = `<p style="margin:0 0 14px">Hola ${safeName},</p><p style="margin:0 0 14px">Han pasado unos días desde que terminó tu prueba. Tu sitio y tus datos siguen guardados en <strong>${tenantName}</strong>. Elige un plan para retomarlo.</p>`;
        ctaLabel = "Elegir un plan";
        break;
      case "expired7":
        subject = "Últimos días para retomar tu proyecto";
        title = "No dejes tu proyecto a medias";
        body = `<p style="margin:0 0 14px">Hola ${safeName},</p><p style="margin:0 0 14px">Tu cuenta de <strong>${tenantName}</strong> sigue lista para reactivarse. Elige un plan hoy y vuelve a tu panel.</p>`;
        ctaLabel = "Reactivar cuenta";
        break;
    }

    const html = this.renderEmailLayout({
      branding,
      title,
      body,
      ctaLabel,
      ctaUrl: `${frontend}${ctaPath}`,
      secondaryLabel,
      secondaryUrl: secondaryPath ? `${frontend}${secondaryPath}` : undefined,
    });

    await this.send({ to: params.to, subject, html });
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

  private async getBranding() {
    try {
      return await this.platformService.getBranding();
    } catch {
      return { logoUrl: null, primaryColor: "#201b51", secondaryColor: "#f29200" };
    }
  }

  private resolveAssetUrl(url: string | null): string {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    const base = process.env.PUBLIC_API_URL || process.env.API_URL || "";
    return base ? `${base}${url}` : url;
  }

  private contrastText(hex: string): string {
    const value = /^#[0-9a-f]{6}$/i.test(hex) ? hex : "#f29200";
    const channels = [1, 3, 5].map((index) => {
      const channel = parseInt(value.slice(index, index + 2), 16) / 255;
      return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
    });
    const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    return luminance > 0.45 ? "#111827" : "#ffffff";
  }

  private escapeHtml(value: string): string {
    return String(value).replace(/[&<>"']/g, (char) => {
      const map: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return map[char] || char;
    });
  }

  private renderEmailLayout(opts: {
    branding: { logoUrl: string | null; primaryColor: string; secondaryColor: string };
    title: string;
    body: string;
    ctaLabel: string;
    ctaUrl: string;
    secondaryLabel?: string;
    secondaryUrl?: string;
  }): string {
    const primary = opts.branding.primaryColor || "#201b51";
    const secondary = opts.branding.secondaryColor || "#f29200";
    const onSecondary = this.contrastText(secondary);
    const logo = this.resolveAssetUrl(opts.branding.logoUrl);
    const brandHtml = logo
      ? `<img src="${logo}" alt="Plataforma" style="display:block;max-height:42px;max-width:180px;margin:0 auto;border:0" />`
      : `<span style="font-size:20px;font-weight:800;color:${primary};letter-spacing:-0.02em">Plataforma</span>`;
    const secondaryHtml =
      opts.secondaryUrl && opts.secondaryLabel
        ? `<div style="margin-top:14px"><a href="${opts.secondaryUrl}" style="color:${primary};font-size:13px;text-decoration:underline">${opts.secondaryLabel}</a></div>`
        : "";

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${opts.title}</title>
<style>
  @media (max-width:600px) {
    .email-card { width: 100% !important; }
    .email-pad { padding-left: 20px !important; padding-right: 20px !important; }
    .email-title { font-size: 22px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f7">
<tr><td style="padding:24px 12px">
<table role="presentation" class="email-card" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="height:6px;background:${secondary}"></td></tr>
<tr><td class="email-pad" style="padding:28px 32px 0;text-align:center">${brandHtml}</td></tr>
<tr><td class="email-pad" style="padding:22px 32px 0;text-align:center">
<h1 class="email-title" style="margin:0;font-size:26px;line-height:1.25;color:${primary}">${opts.title}</h1>
</td></tr>
<tr><td class="email-pad" style="padding:16px 32px 0;font-size:15px;line-height:1.65;color:#475569">${opts.body}</td></tr>
<tr><td class="email-pad" style="padding:26px 32px 34px;text-align:center">
<a href="${opts.ctaUrl}" style="display:inline-block;background:${secondary};color:${onSecondary};text-decoration:none;font-weight:700;font-size:15px;padding:14px 26px;border-radius:999px">${opts.ctaLabel}</a>
${secondaryHtml}
</td></tr>
<tr><td class="email-pad" style="padding:18px 32px;background:#f8fafc;text-align:center;font-size:12px;line-height:1.6;color:#94a3b8">
Plataforma · ${new Date().getFullYear()}<br/>
Recibes este correo porque creaste una cuenta en Plataforma.
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
  }
}
