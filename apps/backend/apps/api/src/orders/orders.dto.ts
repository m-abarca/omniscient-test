import {
  IsIn,
  IsISO8601,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';
import type { CreateOrderInput, OrderStatus } from '@omniscient/types';
import { ORDER_STATUSES } from '@omniscient/types';

export class CreateOrderDto implements CreateOrderInput {
  @IsString()
  @MinLength(1)
  reference!: string;

  @IsString()
  @MinLength(1)
  product!: string;

  @IsInt()
  @IsPositive()
  quantity!: number;

  @IsISO8601()
  startDate!: string;

  @IsISO8601()
  endDate!: string;

  @IsOptional()
  @IsIn(ORDER_STATUSES as readonly string[])
  status?: OrderStatus;
}
