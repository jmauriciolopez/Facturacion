import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UUID } from '../../../../core/shared';

/**
 * Decorator to extract the Tenant ID from the request object,
 * which should be populated by the TenantGuard.
 */
export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UUID => {
    const request = ctx.switchToHttp().getRequest<{ tenantId: UUID }>();
    return request.tenantId;
  },
);
