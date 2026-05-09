import type { ProductionOrder } from '@omniscient/types';
import { reschedulePlanned } from './reschedule';

const makeOrder = (overrides: Partial<ProductionOrder>): ProductionOrder => ({
  id: 'id-default',
  reference: 'REF',
  product: 'Widget',
  quantity: 1,
  startDate: '2026-06-01T08:00:00.000Z',
  endDate: '2026-06-02T08:00:00.000Z',
  status: 'planned',
  createdAt: '2026-05-01T00:00:00.000Z',
  ...overrides,
});

describe('reschedulePlanned', () => {
  it('returns empty result for empty input', () => {
    expect(reschedulePlanned([])).toEqual({ updated: [], total: 0 });
  });

  it('returns no updates for a single planned order', () => {
    const orders = [makeOrder({ id: 'a' })];
    const result = reschedulePlanned(orders);
    expect(result.updated).toEqual([]);
    expect(result.total).toBe(1);
  });

  it('returns no updates when two orders do not overlap', () => {
    const a = makeOrder({
      id: 'a',
      createdAt: '2026-05-01T00:00:00.000Z',
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-02T00:00:00.000Z',
    });
    const b = makeOrder({
      id: 'b',
      createdAt: '2026-05-02T00:00:00.000Z',
      startDate: '2026-06-03T00:00:00.000Z',
      endDate: '2026-06-04T00:00:00.000Z',
    });
    expect(reschedulePlanned([a, b]).updated).toEqual([]);
  });

  it('shifts the later-createdAt order when two overlap', () => {
    const a = makeOrder({
      id: 'a',
      createdAt: '2026-05-01T00:00:00.000Z',
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-05T00:00:00.000Z',
    });
    const b = makeOrder({
      id: 'b',
      createdAt: '2026-05-02T00:00:00.000Z',
      startDate: '2026-06-03T00:00:00.000Z',
      endDate: '2026-06-07T00:00:00.000Z',
    });
    const result = reschedulePlanned([a, b]);
    expect(result.updated).toHaveLength(1);
    expect(result.updated[0].id).toBe('b');
    expect(result.updated[0].startDate).toBe('2026-06-05T00:00:00.000Z');
    expect(result.updated[0].endDate).toBe('2026-06-09T00:00:00.000Z');
  });

  it('does NOT shift two orders that touch at the boundary (half-open)', () => {
    const a = makeOrder({
      id: 'a',
      createdAt: '2026-05-01T00:00:00.000Z',
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-05T00:00:00.000Z',
    });
    const b = makeOrder({
      id: 'b',
      createdAt: '2026-05-02T00:00:00.000Z',
      startDate: '2026-06-05T00:00:00.000Z',
      endDate: '2026-06-07T00:00:00.000Z',
    });
    expect(reschedulePlanned([a, b]).updated).toEqual([]);
  });

  it('cascades shifts across three overlapping orders', () => {
    const a = makeOrder({
      id: 'a',
      createdAt: '2026-05-01T00:00:00.000Z',
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-05T00:00:00.000Z',
    });
    const b = makeOrder({
      id: 'b',
      createdAt: '2026-05-02T00:00:00.000Z',
      startDate: '2026-06-03T00:00:00.000Z',
      endDate: '2026-06-07T00:00:00.000Z',
    });
    const c = makeOrder({
      id: 'c',
      createdAt: '2026-05-03T00:00:00.000Z',
      startDate: '2026-06-06T00:00:00.000Z',
      endDate: '2026-06-08T00:00:00.000Z',
    });
    const result = reschedulePlanned([a, b, c]);
    const ids = result.updated.map((o) => o.id).sort();
    expect(ids).toEqual(['b', 'c']);
    const bUpdated = result.updated.find((o) => o.id === 'b');
    const cUpdated = result.updated.find((o) => o.id === 'c');
    expect(bUpdated?.startDate).toBe('2026-06-05T00:00:00.000Z');
    expect(bUpdated?.endDate).toBe('2026-06-09T00:00:00.000Z');
    expect(cUpdated?.startDate).toBe('2026-06-09T00:00:00.000Z');
    expect(cUpdated?.endDate).toBe('2026-06-11T00:00:00.000Z');
  });

  it('only shifts the conflicting orders in a mixed input', () => {
    const a = makeOrder({
      id: 'a',
      createdAt: '2026-05-01T00:00:00.000Z',
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-03T00:00:00.000Z',
    });
    const b = makeOrder({
      id: 'b',
      createdAt: '2026-05-02T00:00:00.000Z',
      startDate: '2026-06-02T00:00:00.000Z',
      endDate: '2026-06-04T00:00:00.000Z',
    });
    const c = makeOrder({
      id: 'c',
      createdAt: '2026-05-03T00:00:00.000Z',
      startDate: '2026-07-01T00:00:00.000Z',
      endDate: '2026-07-02T00:00:00.000Z',
    });
    const result = reschedulePlanned([a, b, c]);
    expect(result.updated.map((o) => o.id)).toEqual(['b']);
    expect(result.updated[0].startDate).toBe('2026-06-03T00:00:00.000Z');
    expect(result.updated[0].endDate).toBe('2026-06-05T00:00:00.000Z');
  });

  it('uses lexicographic id as tiebreak when createdAt is identical', () => {
    const a = makeOrder({
      id: 'a',
      createdAt: '2026-05-01T00:00:00.000Z',
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-05T00:00:00.000Z',
    });
    const b = makeOrder({
      id: 'b',
      createdAt: '2026-05-01T00:00:00.000Z',
      startDate: '2026-06-02T00:00:00.000Z',
      endDate: '2026-06-04T00:00:00.000Z',
    });
    const result = reschedulePlanned([b, a]);
    expect(result.updated.map((o) => o.id)).toEqual(['b']);
    expect(result.updated[0].startDate).toBe('2026-06-05T00:00:00.000Z');
    expect(result.updated[0].endDate).toBe('2026-06-07T00:00:00.000Z');
  });

  it('preserves a zero-duration order through a shift', () => {
    const a = makeOrder({
      id: 'a',
      createdAt: '2026-05-01T00:00:00.000Z',
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-05T00:00:00.000Z',
    });
    const b = makeOrder({
      id: 'b',
      createdAt: '2026-05-02T00:00:00.000Z',
      startDate: '2026-06-02T00:00:00.000Z',
      endDate: '2026-06-02T00:00:00.000Z',
    });
    const result = reschedulePlanned([a, b]);
    const bUpdated = result.updated.find((o) => o.id === 'b');
    expect(bUpdated?.startDate).toBe('2026-06-05T00:00:00.000Z');
    expect(bUpdated?.endDate).toBe('2026-06-05T00:00:00.000Z');
  });

  it('ignores non-planned orders', () => {
    const a = makeOrder({
      id: 'a',
      status: 'in_progress',
      createdAt: '2026-05-01T00:00:00.000Z',
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-05T00:00:00.000Z',
    });
    const b = makeOrder({
      id: 'b',
      status: 'planned',
      createdAt: '2026-05-02T00:00:00.000Z',
      startDate: '2026-06-02T00:00:00.000Z',
      endDate: '2026-06-04T00:00:00.000Z',
    });
    const result = reschedulePlanned([a, b]);
    expect(result.total).toBe(1);
    expect(result.updated).toEqual([]);
  });

  it('is idempotent: applying updates and running again yields no further changes', () => {
    const a = makeOrder({
      id: 'a',
      createdAt: '2026-05-01T00:00:00.000Z',
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-05T00:00:00.000Z',
    });
    const b = makeOrder({
      id: 'b',
      createdAt: '2026-05-02T00:00:00.000Z',
      startDate: '2026-06-03T00:00:00.000Z',
      endDate: '2026-06-07T00:00:00.000Z',
    });

    const first = reschedulePlanned([a, b]);
    const updatedById = new Map(first.updated.map((u) => [u.id, u]));
    const next = [a, b].map((o) => updatedById.get(o.id) ?? o);

    const second = reschedulePlanned(next);
    expect(second.updated).toEqual([]);
  });

  it('does not mutate its input', () => {
    const a = Object.freeze(
      makeOrder({
        id: 'a',
        createdAt: '2026-05-01T00:00:00.000Z',
        startDate: '2026-06-01T00:00:00.000Z',
        endDate: '2026-06-05T00:00:00.000Z',
      }),
    );
    const b = Object.freeze(
      makeOrder({
        id: 'b',
        createdAt: '2026-05-02T00:00:00.000Z',
        startDate: '2026-06-03T00:00:00.000Z',
        endDate: '2026-06-07T00:00:00.000Z',
      }),
    );
    const input = Object.freeze([a, b]) as readonly ProductionOrder[];
    expect(() => reschedulePlanned(input)).not.toThrow();
    expect(a.startDate).toBe('2026-06-01T00:00:00.000Z');
    expect(b.startDate).toBe('2026-06-03T00:00:00.000Z');
  });

  it('preserves the original duration for every output order', () => {
    const a = makeOrder({
      id: 'a',
      createdAt: '2026-05-01T00:00:00.000Z',
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-05T00:00:00.000Z',
    });
    const b = makeOrder({
      id: 'b',
      createdAt: '2026-05-02T00:00:00.000Z',
      startDate: '2026-06-03T00:00:00.000Z',
      endDate: '2026-06-04T12:00:00.000Z',
    });
    const c = makeOrder({
      id: 'c',
      createdAt: '2026-05-03T00:00:00.000Z',
      startDate: '2026-06-04T00:00:00.000Z',
      endDate: '2026-06-04T08:00:00.000Z',
    });
    const result = reschedulePlanned([a, b, c]);
    const originalDuration = new Map(
      [a, b, c].map((o) => [
        o.id,
        Date.parse(o.endDate) - Date.parse(o.startDate),
      ]),
    );
    for (const u of result.updated) {
      expect(Date.parse(u.endDate) - Date.parse(u.startDate)).toBe(
        originalDuration.get(u.id),
      );
    }
  });
});
