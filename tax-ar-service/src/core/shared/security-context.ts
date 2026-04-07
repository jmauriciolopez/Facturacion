import { UUID } from './index';

/**
 * Encapsulates the identity and context of a request, 
 * specifically identifying the tenant currently being operated on.
 */
export interface SecurityContext {
  tenantId: UUID;
  authenticatedUserId?: string;
  roles?: string[];
}

/**
 * Utility to validate and handle security contexts.
 */
export class SecurityContextUtils {
  static create(tenantId: UUID): SecurityContext {
    return { tenantId };
  }
}
