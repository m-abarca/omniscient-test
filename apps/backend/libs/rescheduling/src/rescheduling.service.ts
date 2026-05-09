import { Injectable } from '@nestjs/common';
import type { ProductionOrder, RescheduleResult } from '@omniscient/types';
import { reschedulePlanned } from './reschedule';

@Injectable()
export class ReschedulingService {
  reschedule(orders: readonly ProductionOrder[]): RescheduleResult {
    return reschedulePlanned(orders);
  }
}
