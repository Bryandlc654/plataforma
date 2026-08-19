import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    const isSystemUser =
      user?.roles?.includes("super_admin") || user?.roles?.includes("support");
    if (isSystemUser) {
      return true;
    }

    if (!user || !user.permissions) {
      throw new ForbiddenException("User has no permissions assigned");
    }

    const hasPermissions = requiredPermissions.every((permission) =>
      user.permissions?.includes(permission)
    );

    if (!hasPermissions) {
      throw new ForbiddenException(
        `Missing permissions: ${requiredPermissions.join(", ")}`
      );
    }

    return true;
  }
}
