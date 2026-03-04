import { HttpStatus } from '@nestjs/common';

import { ApiCodes } from '../../../common/constants/api-codes';
import { ApiException } from '../../../common/exceptions/api.exception';

export function assertActivityActive(
  activity: { status: string; endAt: Date | null } | null,
): void {
  if (!activity) {
    throw new ApiException(ApiCodes.ACTIVITY_NOT_FOUND, HttpStatus.NOT_FOUND);
  }
  if (activity.status !== 'open') {
    throw new ApiException(ApiCodes.ACTIVITY_NOT_ACTIVE);
  }
  const now = new Date();
  if (activity.endAt && activity.endAt < now) {
    throw new ApiException(ApiCodes.ACTIVITY_ALREADY_ENDED);
  }
}
