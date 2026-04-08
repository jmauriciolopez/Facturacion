import { Injectable } from '@nestjs/common';
import { FiscalStatus } from '../../core/domain/enums';

export interface UISuggestedAction {
  label: string;
  action: string;
  type: 'primary' | 'secondary' | 'danger';
}

export interface UIContext {
  displayStatus: string;
  statusColor: 'success' | 'warning' | 'error' | 'info' | 'default';
  statusIcon: string;
  errorSummary?: string;
  suggestedActions: UISuggestedAction[];
}

@Injectable()
export class UIMapperService {
  /**
   * Generates a UI Context based on technical status and raw response from AFIP.
   */
  getUIContext(status: FiscalStatus, rawResponse?: string): UIContext {
    const context: UIContext = {
      displayStatus: this.getDisplayStatus(status),
      statusColor: this.getStatusColor(status),
      statusIcon: this.getStatusIcon(status),
      suggestedActions: [],
    };

    if (status === FiscalStatus.REJECTED || status === FiscalStatus.ERROR) {
      context.errorSummary = this.parseErrorSummary(rawResponse);
      context.suggestedActions = this.mapSuggestedActions(status, rawResponse);
    } else if (status === FiscalStatus.AUTHORIZED) {
      context.suggestedActions = [
        { label: 'Descargar PDF', action: 'DOWNLOAD_PDF', type: 'primary' },
        { label: 'Ver Auditoría', action: 'VIEW_AUDIT', type: 'secondary' },
      ];
    } else if (status === FiscalStatus.DRAFT) {
      context.suggestedActions = [
        { label: 'Emitir Comprobante', action: 'AUTHORIZE', type: 'primary' },
        { label: 'Editar Borrador', action: 'EDIT', type: 'secondary' },
      ];
    }

    return context;
  }

  private getDisplayStatus(status: FiscalStatus): string {
    const mapping: Record<FiscalStatus, string> = {
      [FiscalStatus.DRAFT]: 'Borrador',
      [FiscalStatus.PENDING]: 'Pendiente de Autorización',
      [FiscalStatus.AUTHORIZED]: 'Aceptado por AFIP',
      [FiscalStatus.REJECTED]: 'Rechazado por AFIP',
      [FiscalStatus.ERROR]: 'Error de Sistema',
      [FiscalStatus.CANCELLED]: 'Anulado',
    };
    return mapping[status] || status;
  }

  private getStatusColor(status: FiscalStatus): UIContext['statusColor'] {
    const mapping: Record<FiscalStatus, UIContext['statusColor']> = {
      [FiscalStatus.DRAFT]: 'default',
      [FiscalStatus.PENDING]: 'info',
      [FiscalStatus.AUTHORIZED]: 'success',
      [FiscalStatus.REJECTED]: 'error',
      [FiscalStatus.ERROR]: 'warning',
      [FiscalStatus.CANCELLED]: 'default',
    };
    return mapping[status] || 'default';
  }

  private getStatusIcon(status: FiscalStatus): string {
    const mapping: Record<FiscalStatus, string> = {
      [FiscalStatus.DRAFT]: 'file-text',
      [FiscalStatus.PENDING]: 'clock',
      [FiscalStatus.AUTHORIZED]: 'check-circle',
      [FiscalStatus.REJECTED]: 'x-circle',
      [FiscalStatus.ERROR]: 'alert-triangle',
      [FiscalStatus.CANCELLED]: 'slash',
    };
    return mapping[status] || 'help-circle';
  }

  private parseErrorSummary(rawResponse?: string): string {
    if (!rawResponse) return 'No se recibió detalle del error.';

    // Intentar detectar patrones comunes de AFIP
    if (rawResponse.includes('10015')) return 'Fecha del comprobante fuera de rango permitido.';
    if (rawResponse.includes('10048')) return 'El CUIT del receptor es inválido o no está activo.';
    if (rawResponse.includes('Punto de Venta')) return 'El punto de venta no está habilitado en AFIP.';
    if (rawResponse.includes('token') || rawResponse.includes('sign')) return 'Error de autenticación con AFIP (Ticket de Acceso).';

    // Si es un JSON, intentar extraer el mensaje
    try {
      const parsed = JSON.parse(rawResponse);
      if (parsed.Msg) return parsed.Msg;
      if (Array.isArray(parsed) && parsed[0]?.Msg) return parsed[0].Msg;
    } catch {
      // No es JSON o falló el parseo
    }

    return rawResponse.length > 100 ? rawResponse.substring(0, 97) + '...' : rawResponse;
  }

  private mapSuggestedActions(status: FiscalStatus, rawResponse?: string): UISuggestedAction[] {
    const actions: UISuggestedAction[] = [];

    if (status === FiscalStatus.ERROR) {
      actions.push({ label: 'Reintentar Emisión', action: 'RETRY', type: 'primary' });
    }

    if (status === FiscalStatus.REJECTED) {
      if (rawResponse?.includes('10048') || rawResponse?.includes('CUIT')) {
        actions.push({ label: 'Corregir Cliente', action: 'EDIT_CUSTOMER', type: 'primary' });
      } else if (rawResponse?.includes('Fecha')) {
        actions.push({ label: 'Cambiar Fecha', action: 'EDIT_DATE', type: 'primary' });
      } else {
        actions.push({ label: 'Revisar y Reintentar', action: 'RETRY', type: 'primary' });
      }
    }

    actions.push({ label: 'Contactar Soporte', action: 'SUPPORT', type: 'secondary' });
    
    return actions;
  }
}
