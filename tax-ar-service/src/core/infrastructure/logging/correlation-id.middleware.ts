import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const correlationHeader = 'x-correlation-id';
    
    // Check if header already exists, otherwise generate new UUID
    const correlationId = (req.headers[correlationHeader] as string) || randomUUID();
    
    // Persist in headers for both request (to be used by logger) and response (for the client)
    req.headers[correlationHeader] = correlationId;
    res.setHeader(correlationHeader, correlationId);
    
    // Add to request object for easy access in interceptors/controllers if needed
    (req as any).correlationId = correlationId;
    
    next();
  }
}
