import type { ApiCode } from '../constants/api-codes';
import { ApiMessages } from '../constants/api-messages';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  code: ApiCode;
  message: string;
  data: T | null;
  meta: PaginationMeta | null;
}

export class ResponseFactory {
  private static resolveMessage(code: ApiCode): string {
    return ApiMessages[code] ?? 'Unknown response';
  }

  static ok<T>(code: ApiCode, data?: T, meta?: PaginationMeta): ApiResponse<T> {
    return {
      success: true,
      code,
      message: this.resolveMessage(code),
      data: data ?? null,
      meta: meta ?? null,
    };
  }

  static created<T>(code: ApiCode, data?: T): ApiResponse<T> {
    return {
      success: true,
      code,
      message: this.resolveMessage(code),
      data: data ?? null,
      meta: null,
    };
  }

  static error<T>(code: ApiCode, data?: T): ApiResponse<T> {
    return {
      success: false,
      code,
      message: this.resolveMessage(code),
      data: data ?? null,
      meta: null,
    };
  }

  static paginated<T>(
    code: ApiCode,
    data: T[],
    meta: PaginationMeta,
  ): ApiResponse<T[]> {
    return {
      success: true,
      code,
      message: this.resolveMessage(code),
      data,
      meta,
    };
  }
}
