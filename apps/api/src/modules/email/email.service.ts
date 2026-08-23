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

  private getFrontendUrl(): string {
    return this.configService.get<string>("FRONTEND_URL", "https://build.icebergup.com");
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
