require('dotenv').config({ path: '../../.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
const { Expo } = require('expo-server-sdk');

async function qaTest() {
  console.log("--- QA TEST: Push Notifications ---");
  
  // 1. Get the first tenant & user
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) return console.log("No tenant found");
  console.log("Tenant:", tenant.id);
  
  const userTenant = await prisma.userTenant.findFirst({ where: { tenantId: tenant.id } });
  if (!userTenant) return console.log("No user in tenant");
  console.log("User ID:", userTenant.userId);
  
  // 2. Register a dummy push token for this user
  const DUMMY_TOKEN = 'ExponentPushToken[dummyTokenForQATest_1234]';
  await prisma.pushToken.deleteMany({ where: { token: DUMMY_TOKEN } });
  await prisma.pushToken.create({
    data: { token: DUMMY_TOKEN, userId: userTenant.userId, device: 'QA-Test' }
  });
  console.log("Registered dummy token for user");
  
  // 3. Simulate Lead Submission (what LeadsService does)
  const expo = new Expo();
  
  // Query tokens like NotificationsService does
  const userTenants = await prisma.userTenant.findMany({ where: { tenantId: tenant.id }, select: { userId: true } });
  const userIds = userTenants.map(ut => ut.userId);
  const tokens = await prisma.pushToken.findMany({ where: { userId: { in: userIds } } });
  console.log(`Found ${tokens.length} push tokens for tenant users.`);
  
  const messages = [];
  for (const pushToken of tokens) {
    if (!Expo.isExpoPushToken(pushToken.token)) {
      console.log(`Token ${pushToken.token} is NOT a valid Expo push token format.`);
      continue;
    }
    messages.push({
      to: pushToken.token,
      sound: 'default',
      title: '¡Nuevo Lead Recibido!',
      body: 'Has recibido un nuevo prospecto: QA Test Lead',
      data: { leadId: 'qa-test-123', url: '/leads' },
    });
  }
  
  console.log(`Sending ${messages.length} messages via Expo...`);
  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];
  
  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error("Error sending push notification chunk", error);
    }
  }
  
  console.log("Expo Push Tickets Received:", tickets);
  
  // Clean up
  await prisma.pushToken.deleteMany({ where: { token: DUMMY_TOKEN } });
  console.log("--- QA TEST COMPLETE ---");
}

qaTest().catch(console.error).finally(() => prisma.$disconnect());
