import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListParticipantsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['confirmed', 'pending', 'all'])
  status?: 'confirmed' | 'pending' | 'all';
}
