import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListContactsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['user', 'external_contact', 'all'])
  type?: 'user' | 'external_contact' | 'all' = 'all';
}
