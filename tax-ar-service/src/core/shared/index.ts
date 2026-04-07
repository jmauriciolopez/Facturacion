/**
 * Tipos y utilidades compartidas por todo el dominio.
 * No deben depender de NestJS ni de ningún ORM.
 */

export type UUID = string;
export type ISODateString = string;

/** Resultado tipado para operaciones que pueden fallar sin lanzar excepción */
export type Result<T, E = string> =
  | { success: true; data: T }
  | { success: false; error: E };

export const ok = <T>(data: T): Result<T> => ({ success: true, data });
export const fail = <E = string>(error: E): Result<never, E> => ({ success: false, error });

/** Paginación estándar */
export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
