import { IsIn, IsOptional } from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListReceivedInvitationsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['pending', 'accepted', 'past', 'expired', 'all'])
  status?: 'pending' | 'accepted' | 'past' | 'expired' | 'all' = 'all';
}
