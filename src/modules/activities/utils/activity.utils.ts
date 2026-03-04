import { BadRequestException } from '@nestjs/common';

export function assertActivityActive(
  activity: { status: string; endAt: Date | null } | null,
): void {
  if (!activity) {
    throw new BadRequestException('Activity not found');
  }
  if (activity.status !== 'open') {
    throw new BadRequestException('Activity is no longer active');
  }
  const now = new Date();
  if (activity.endAt && activity.endAt < now) {
    throw new BadRequestException('Activity has already ended');
  }
}
