import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';

interface RequestWithTenant extends ExpressRequest {
  tenantId?: string;
}

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Guard that extracts and validates the Tenant ID from the request headers.
 * Attaches the tenant ID to the request object for use with the @CurrentTenant decorator.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithTenant>();
    const tenantId = request.headers['x-tenant-id'];

    if (!tenantId || typeof tenantId !== 'string') {
      throw new BadRequestException('X-Tenant-ID header is required');
    }

    if (!UUID_V4_REGEX.test(tenantId)) {
      throw new BadRequestException(
        'Invalid X-Tenant-ID format. Must be a UUID v4.',
      );
    }

    // Attach to request for the decorator
    request.tenantId = tenantId;

    return true;
  }
}
