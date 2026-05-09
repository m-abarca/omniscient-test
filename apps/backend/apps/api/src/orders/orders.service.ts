import { Injectable } from '@nestjs/common';
import { ReschedulingService } from '@app/rescheduling';
import type {
  CreateOrderInput,
  ProductionOrder,
  RescheduleResult,
} from '@omniscient/types';
import { DirectusClient } from './directus.client';

@Injectable()
export class OrdersService {
  constructor(
    private readonly directus: DirectusClient,
    private readonly rescheduler: ReschedulingService,
  ) {}

  list(): Promise<ProductionOrder[]> {
    return this.directus.list();
  }

  create(input: CreateOrderInput): Promise<ProductionOrder> {
    return this.directus.create(input);
  }

  async reschedule(): Promise<RescheduleResult> {
    const planned = await this.directus.listPlanned();
    const result = this.rescheduler.reschedule(planned);
    if (result.updated.length === 0) {
      return result;
    }
    const persisted = await Promise.all(
      result.updated.map((o) =>
        this.directus.patch(o.id, {
          startDate: o.startDate,
          endDate: o.endDate,
        }),
      ),
    );
    return { updated: persisted, total: result.total };
  }
}
