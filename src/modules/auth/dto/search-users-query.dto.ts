import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class SearchUsersQueryDto extends PaginationQueryDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2, { message: 'Search query must be at least 2 characters' })
  q: string;
}
