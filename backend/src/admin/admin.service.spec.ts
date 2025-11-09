import { AdminService } from './admin.service';

describe('AdminService - summarizeEnergyWindow', () => {
  let service: AdminService;

  beforeEach(() => {
    service = new AdminService({} as any);
  });

  it('calculates net consumption using meter deltas', () => {
    const readings = [
      { ept_c: 100, ept_g: 5, pt: 200 },
      { ept_c: 115, ept_g: 7, pt: 210 },
      { ept_c: 120, ept_g: 9, pt: 205 },
    ];

    const summary = (service as any).summarizeEnergyWindow(readings, 3);

    expect(summary.consumption).toBeCloseTo(20);
    expect(summary.generation).toBeCloseTo(4);
    expect(summary.netConsumption).toBeCloseTo(16);
    expect(summary.reliability).toBe('measured');
  });

  it('falls back to power-based estimation when only one reading is available', () => {
    const readings = [{ ept_c: 300, ept_g: 0, pt: 500 }];

    const summary = (service as any).summarizeEnergyWindow(readings, 3);

    expect(summary.consumption).toBeGreaterThan(0);
    expect(summary.generation).toBe(0);
    expect(summary.netConsumption).toBe(summary.consumption);
    expect(summary.reliability).toBe('estimated');
  });

  it('allows negative net consumption when generation exceeds import', () => {
    const readings = [
      { ept_c: 1000, ept_g: 10, pt: 120 },
      { ept_c: 1010, ept_g: 25, pt: -60 },
      { ept_c: 1012, ept_g: 40, pt: -80 },
    ];

    const summary = (service as any).summarizeEnergyWindow(readings, 4);

    expect(summary.consumption).toBeCloseTo(12);
    expect(summary.generation).toBeCloseTo(30);
    expect(summary.netConsumption).toBeCloseTo(-18);
    expect(summary.reliability).toBe('measured');
  });
});

