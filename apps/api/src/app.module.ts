import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard, seconds } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import configuration from "./config/configuration";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { TenantsModule } from "./modules/tenants/tenants.module";
import { RolesModule } from "./modules/roles/roles.module";
import { PlansModule } from "./modules/plans/plans.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { EmailModule } from "./modules/email/email.module";
import { SeedModule } from "./modules/seed/seed.module";
import { TemplatesModule } from "./modules/templates/templates.module";
import { SitesModule } from "./modules/sites/sites.module";
import { PagesModule } from "./modules/pages/pages.module";
import { MediaModule } from "./modules/media/media.module";
import { PublishingModule } from "./modules/publishing/publishing.module";
import { LeadsModule } from "./modules/leads/leads.module";
import { SeoModule } from "./modules/seo/seo.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { WhatsAppModule } from "./modules/whatsapp/whatsapp.module";
import { SubscriptionsModule } from "./modules/subscriptions/subscriptions.module";
import { BillingModule } from "./modules/billing/billing.module";
import { InvitationsModule } from "./modules/invitations/invitations.module";
import { AuditModule } from "./modules/audit/audit.module";
import { ProductsModule } from "./modules/products/products.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { CouponsModule } from "./modules/coupons/coupons.module";
import { BookingsModule } from "./modules/bookings/bookings.module";
import { TicketsModule } from "./modules/tickets/tickets.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { PermissionsGuard } from "./common/guards/permissions.guard";
import { TenantMiddleware } from "./common/middleware/tenant.middleware";
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { AppDownloadModule } from './modules/app-download/app-download.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [
        ".env",
        ".env.local",
        ".env.development",
        "../.env",
        "../../.env",
        "../.env.local",
        "../../.env.local",
      ],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: seconds(parseInt(process.env.RATE_LIMIT_TTL || "60", 10)),
        limit: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    TenantsModule,
    RolesModule,
    PlansModule,
    DashboardModule,
    EmailModule,
    SeedModule,
    TemplatesModule,
    SitesModule,
    PagesModule,
    MediaModule,
    PublishingModule,
    LeadsModule,
    SeoModule,
    AnalyticsModule,
    WhatsAppModule,
    SubscriptionsModule,
    BillingModule,
    InvitationsModule,
    AuditModule,
    ProductsModule,
    OrdersModule,
    CouponsModule,
    BookingsModule,
    TicketsModule,
    NotificationsModule,
    ReviewsModule,
    AppDownloadModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes("*");
  }
}
