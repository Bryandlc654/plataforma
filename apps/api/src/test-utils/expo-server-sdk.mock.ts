/**
 * Doble de prueba de expo-server-sdk: el paquete real es solo ESM y Jest (CommonJS)
 * no puede cargarlo. Se conecta con moduleNameMapper en la configuración de Jest.
 */
export const sent: any[][] = [];

export class Expo {
  static isExpoPushToken(token: unknown): boolean {
    return typeof token === "string" && /^Expo(nent)?PushToken\[.+\]$/.test(token);
  }

  chunkPushNotifications<T>(messages: T[]): T[][] {
    return messages.length ? [messages] : [];
  }

  async sendPushNotificationsAsync(chunk: any[]) {
    sent.push(chunk);
    return chunk.map(() => ({ status: "ok", id: "ticket" }));
  }
}

export type ExpoPushMessage = Record<string, any>;
export type ExpoPushTicket = Record<string, any>;
