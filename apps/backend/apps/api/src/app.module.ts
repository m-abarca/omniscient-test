import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ReschedulingModule } from '@app/rescheduling';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ReschedulingModule,
    OrdersModule,
  ],
})
export class AppModule {}
