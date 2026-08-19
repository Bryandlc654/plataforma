import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtConfig {
  constructor(private configService: ConfigService) {}

  get secret(): string {
    return this.configService.getOrThrow<string>("jwt.secret");
  }

  get refreshSecret(): string {
    return this.configService.getOrThrow<string>("jwt.refreshSecret");
  }

  get expiration(): string {
    return this.configService.get<string>("jwt.expiration", "15m");
  }

  get refreshExpiration(): string {
    return this.configService.get<string>("jwt.refreshExpiration", "7d");
  }
}
