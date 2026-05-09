import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import type {
  ProductionOrder,
  RescheduleResult,
} from '@omniscient/types';
import { CreateOrderDto } from './orders.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  list(): Promise<ProductionOrder[]> {
    return this.orders.list();
  }

  @Post()
  create(@Body() dto: CreateOrderDto): Promise<ProductionOrder> {
    return this.orders.create(dto);
  }

  @Post('reschedule')
  @HttpCode(200)
  reschedule(): Promise<RescheduleResult> {
    return this.orders.reschedule();
  }
}
