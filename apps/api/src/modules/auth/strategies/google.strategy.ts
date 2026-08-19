import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-google-oauth20";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(configService: ConfigService) {
    const clientID = configService.get<string>("google.clientId");
    const clientSecret = configService.get<string>("google.clientSecret");

    super({
      clientID: clientID || "google-oauth-not-configured",
      clientSecret: clientSecret || "google-oauth-not-configured",
      callbackURL: configService.get<string>("google.callbackUrl") || "",
      scope: ["email", "profile"],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback
  ): Promise<any> {
    const { id, name, emails, photos } = profile;

    const user = {
      id,
      email: emails?.[0]?.value,
      firstName: name?.givenName,
      lastName: name?.familyName,
      picture: photos?.[0]?.value,
    };

    done(null, user);
  }
}
