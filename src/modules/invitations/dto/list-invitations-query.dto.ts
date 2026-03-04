import { IsIn, IsOptional } from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListInvitationsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['pending', 'accepted', 'cancelled', 'all'])
  status?: 'pending' | 'accepted' | 'cancelled' | 'all' = 'all';
}
