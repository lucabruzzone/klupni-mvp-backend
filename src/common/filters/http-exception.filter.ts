import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { ApiCodes } from '../constants/api-codes';
import { ApiMessages } from '../constants/api-messages';
import type { ApiCode } from '../constants/api-codes';
import { ApiException } from '../exceptions/api.exception';

function isApiException(e: unknown): e is ApiException {
  return e instanceof ApiException;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: ApiCode = ApiCodes.INTERNAL_SERVER_ERROR;
    let message = ApiMessages[ApiCodes.INTERNAL_SERVER_ERROR];
    let data: unknown = null;

    if (isApiException(exception)) {
      statusCode = exception.getStatus();
      code = exception.apiCode;
      message = ApiMessages[code];
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null && 'data' in res) {
        data = (res as { data: unknown }).data;
      }
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        code = this.inferCodeFromStatus(statusCode);
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const body = exceptionResponse as Record<string, unknown>;
        const rawMessage = Array.isArray(body.message)
          ? (body.message as string[]).join(', ')
          : (body.message as string);

        if (statusCode === HttpStatus.BAD_REQUEST && Array.isArray(body.message)) {
          code = ApiCodes.VALIDATION_ERROR;
          message = ApiMessages[code];
          data = body.message;
        } else {
          message = rawMessage ?? message;
          code = this.inferCodeFromStatus(statusCode);
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    }

    const envelope = {
      success: false,
      code,
      message,
      data,
      meta: null,
    };

    response.status(statusCode).json(envelope);
  }

  private inferCodeFromStatus(statusCode: number): ApiCode {
    switch (statusCode) {
      case HttpStatus.UNAUTHORIZED:
        return ApiCodes.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ApiCodes.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ApiCodes.NOT_FOUND;
      default:
        return ApiCodes.VALIDATION_ERROR;
    }
  }
}
