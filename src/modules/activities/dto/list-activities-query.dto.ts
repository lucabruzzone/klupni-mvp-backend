import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListActivitiesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['created', 'participating', 'all'])
  type?: 'created' | 'participating' | 'all';

  @IsOptional()
  @IsIn(['upcoming', 'past', 'all'])
  time?: 'upcoming' | 'past' | 'all';
}
