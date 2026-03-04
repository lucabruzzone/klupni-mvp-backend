import { HttpException, HttpStatus } from '@nestjs/common';
import type { ApiCode } from '../constants/api-codes';

export class ApiException extends HttpException {
  constructor(
    public readonly apiCode: ApiCode,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly data?: unknown,
  ) {
    super(
      {
        apiCode,
        message: apiCode,
        data: data ?? null,
      },
      statusCode,
    );
  }
}
