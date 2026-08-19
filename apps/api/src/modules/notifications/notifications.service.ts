import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Expo, ExpoPushMessage } from "expo-server-sdk";

@Injectable()
export class NotificationsService {
  private expo: Expo;
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {
    this.expo = new Expo();
  }

  async registerToken(userId: string, token: string, device?: string) {
    if (!Expo.isExpoPushToken(token)) {
      this.logger.warn(`Invalid Expo push token received: ${token}`);
      return { success: false, message: "Invalid push token" };
    }

    const existing = await this.prisma.pushToken.findUnique({ where: { token } });
    if (existing) {
      if (existing.userId !== userId) {
        await this.prisma.pushToken.update({
          where: { token },
          data: { userId, device },
        });
      }
    } else {
      await this.prisma.pushToken.create({
        data: { token, userId, device },
      });
    }

    return { success: true };
  }

  async unregisterToken(userId: string, token: string) {
    await this.prisma.pushToken.deleteMany({
      where: { userId, token },
    });
    return { success: true };
  }

  async sendPushNotificationToTenant(tenantId: string, title: string, body: string, data?: any) {
    // 1. Find all users in this tenant
    const userTenants = await this.prisma.userTenant.findMany({
      where: { tenantId },
      select: { userId: true },
    });
    
    if (!userTenants.length) return;
    const userIds = userTenants.map(ut => ut.userId);

    // 2. Find all push tokens for these users
    const tokens = await this.prisma.pushToken.findMany({
      where: { userId: { in: userIds } },
    });

    if (!tokens.length) return;

    const messages: ExpoPushMessage[] = [];
    for (const pushToken of tokens) {
      if (!Expo.isExpoPushToken(pushToken.token)) continue;
      messages.push({
        to: pushToken.token,
        sound: "default",
        title,
        body,
        data: data || {},
      });
    }

    const chunks = this.expo.chunkPushNotifications(messages);
    const tickets: import("expo-server-sdk").ExpoPushTicket[] = [];
    
    for (const chunk of chunks) {
      try {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        this.logger.error("Error sending push notification chunk", error);
      }
    }
  }
}
