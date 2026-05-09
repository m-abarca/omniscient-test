import { Module } from '@nestjs/common';
import { ReschedulingModule } from '@app/rescheduling';
import { DirectusClient } from './directus.client';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [ReschedulingModule],
  controllers: [OrdersController],
  providers: [OrdersService, DirectusClient],
})
export class OrdersModule {}
