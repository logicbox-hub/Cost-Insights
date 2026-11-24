import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, RotateCcw } from 'lucide-react';
import {
  ORIGINAL_BUSINESS,
  PRICING_STRUCTURE_META,
  TIERS,
  calculateAllScenarios,
  createDefaultAssumptions,
  createDefaultMultipliers,
  formatCurrency,
  formatMargin,
  formatMultiplier,
  formatPercentChange,
  formatPercentShare,
  formatRequests,
  formatSignedCurrency,
  generateFinanceTakeaway,
  isSteepBillIncrease,
  sanitizeNonNegative,
  type CustomerEconomics,
  type GlobalMultipliers,
  type PricingAssumptions,
  type PricingStructureId,
  type ScenarioSummary,
  type Tier,
} from '@/lib/financeModel';

const STRUCTURES: PricingStructureId[] = ['subscription', 'usage', 'hybrid'];

function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

/* ---------- Primitives ---------- */

function SectionHead({ num, title, lede }: { num: string; title: string; lede?: ReactNode }) {
  return (
    <header className="mb-8 grid gap-3 md:grid-cols-[120px_1fr]">
      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground pt-2">{num}</div>
      <div>
        <h2 className="font-serif text-3xl md:text-[2.1rem] leading-tight text-foreground">{title}</h2>
        {lede && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{lede}</p>}
      </div>
    </header>
  );
}

function Metric({ label, value, sub, negative, testId }: { label: string; value: string; sub?: ReactNode; negative?: boolean; testId: string }) {
  return (
    <div className="py-4">
      <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div data-testid={testId} className={cx('num mt-2 text-2xl md:text-[1.7rem] font-medium', negative && 'loss')}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function NumberField({
  value, onChange, prefix, suffix, step = 1, testId, label, ariaLabel,
}: { value: number; onChange: (v: number) => void; prefix?: string; suffix?: string; step?: number; testId: string; label: string; ariaLabel?: string }) {
  const [text, setText] = useState(String(value));
  const [invalid, setInvalid] = useState(false);
  useEffect(() => {
    if (Number(text) !== value || text.trim() === '') { setText(String(value)); setInvalid(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <label className="block">
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
      <div className={cx(label && 'mt-1', 'flex items-center rounded-md border bg-card px-2.5 focus-within:ring-2 focus-within:ring-ring/30', invalid ? 'border-destructive' : 'border-input')}>
        {prefix && <span className="num text-sm text-muted-foreground">{prefix}</span>}
        <input
          data-testid={testId}
          aria-label={ariaLabel ?? label}
          inputMode="decimal"
          type="number"
          min={0}
          step={step}
          value={text}
          onKeyDown={(e) => {
            if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
              e.preventDefault();
            }
          }}
          onChange={(e) => {
            const t = e.target.value;
            setText(t);
            const n = Number(t);
            if (t.trim() === '' || !Number.isFinite(n) || n < 0) { setInvalid(true); return; }
            setInvalid(false);
            onChange(sanitizeNonNegative(n));
          }}
          onBlur={() => { if (invalid) { setText(String(value)); setInvalid(false); } }}
          className="num w-full bg-transparent py-1.5 pl-1 text-sm outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        {suffix && <span className="text-xs text-muted-foreground whitespace-nowrap">{suffix}</span>}
      </div>
      {invalid && <span className="mt-1 block text-[11px] loss">Enter a number of 0 or more</span>}
    </label>
  );
}

/* ---------- Waterfall ---------- */

function Waterfall({ row }: { row: CustomerEconomics }) {
  const R = row.revenue, I = row.inferenceCost, F = row.infrastructureCost, G = row.grossProfit;
  const steps = [
    { label: 'Revenue', from: 0, to: R, kind: 'pos' as const, v: formatCurrency(R) },
    { label: 'Inference', from: R, to: R - I, kind: 'cost' as const, v: formatCurrency(-I) },
    { label: 'Infrastructure', from: R - I, to: R - I - F, kind: 'cost' as const, v: formatCurrency(-F) },
    { label: 'Gross profit', from: 0, to: G, kind: G < 0 ? ('loss' as const) : ('pos' as const), v: formatCurrency(G) },
  ];
  const max = Math.max(0, R, ...steps.map((s) => Math.max(s.from, s.to)));
  const min = Math.min(0, ...steps.map((s) => Math.min(s.from, s.to)));
  const W = 520, H = 280, padT = 28, padB = 40, padL = 8;
  const span = max - min || 1;
  const y = (v: number) => padT + ((max - v) / span) * (H - padT - padB);
  const colW = (W - padL * 2) / 4;
  const bw = colW * 0.52;
  const fills = { pos: 'hsl(var(--primary))', cost: 'hsl(36 16% 70%)', loss: 'hsl(var(--destructive))' };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`Margin waterfall for ${row.customer.name}`} data-testid="chart-waterfall">
      {steps.map((s, i) => {
        const x = padL + colW * i + (colW - bw) / 2;
        const top = y(Math.max(s.from, s.to));
        const h = Math.max(1, Math.abs(y(s.from) - y(s.to)));
        const labelY = s.kind === 'loss' ? top + h + 15 : top - 8;
        return (
          <g key={s.label}>
            <rect x={x} y={top} width={bw} height={h} fill={fills[s.kind]} rx={1.5} />
            {i < 3 && (
              <line x1={x + bw} x2={x + colW} y1={y(s.to)} y2={y(s.to)} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeWidth={0.8} />
            )}
            <text x={x + bw / 2} y={labelY} textAnchor="middle" className="num" fontSize={12} fill={s.kind === 'loss' ? 'hsl(var(--destructive))' : 'hsl(var(--foreground))'}>{s.v}</text>
            <text x={x + bw / 2} y={H - 12} textAnchor="middle" fontSize={11.5} fill="hsl(var(--muted-foreground))">{s.label}</text>
          </g>
        );
      })}
      <line x1={0} x2={W} y1={y(0)} y2={y(0)} stroke="hsl(var(--foreground))" strokeWidth={1} />
      <text x={W - 2} y={y(0) - 4} textAnchor="end" fontSize={10} fill="hsl(var(--muted-foreground))">$0</text>
    </svg>
  );
}

/* ---------- Page ---------- */

type EconSortKey = 'name' | 'tier' | 'requests' | 'revenue' | 'cost' | 'gp' | 'gm';
type BillSortKey = 'dollar' | 'pct' | 'proposed' | 'name';

export default function Home() {
  const [assumptions, setAssumptions] = useState<PricingAssumptions>(createDefaultAssumptions);
  const [multipliers, setMultipliers] = useState<GlobalMultipliers>(createDefaultMultipliers);
  const [structure, setStructure] = useState<PricingStructureId>('subscription');
  const [selectedId, setSelectedId] = useState(ORIGINAL_BUSINESS.largestLossCustomer.customer.id);
  const [econSort, setEconSort] = useState<{ key: EconSortKey; dir: 1 | -1 }>({ key: 'gp', dir: 1 });
  const [billSort, setBillSort] = useState<BillSortKey>('dollar');
  const [methodOpen, setMethodOpen] = useState(false);

  const scenarios = useMemo(() => calculateAllScenarios(assumptions, multipliers), [assumptions, multipliers]);
  const active = scenarios[structure];
  const takeaway = useMemo(() => generateFinanceTakeaway(scenarios, structure, multipliers), [scenarios, structure, multipliers]);

  const isModified = useMemo(() => {
    return (
      JSON.stringify(assumptions) !== JSON.stringify(createDefaultAssumptions()) ||
      JSON.stringify(multipliers) !== JSON.stringify(createDefaultMultipliers()) ||
      structure !== 'subscription'
    );
  }, [assumptions, multipliers, structure]);

  const reset = () => {
    setAssumptions(createDefaultAssumptions());
    setMultipliers(createDefaultMultipliers());
    setStructure('subscription');
    setSelectedId(ORIGINAL_BUSINESS.largestLossCustomer.customer.id);
  };

  const scenarioLabel = `${active.label} · ${formatMultiplier(multipliers.usageMultiplier)} usage · ${formatMultiplier(multipliers.inferenceCostMultiplier)} inference cost`;

  const tierRank: Record<Tier, number> = { Starter: 0, Growth: 1, Enterprise: 2 };
  const econRows = useMemo(() => {
    const val = (r: CustomerEconomics): number | string => {
      switch (econSort.key) {
        case 'name': return r.customer.name;
        case 'tier': return tierRank[r.customer.tier] * 1e9 + r.monthlyRequests;
        case 'requests': return r.monthlyRequests;
        case 'revenue': return r.revenue;
        case 'cost': return r.totalCostToServe;
        case 'gp': return r.grossProfit;
        case 'gm': return r.grossMargin ?? -Infinity;
      }
    };
    return [...active.customers].sort((a, b) => {
      const va = val(a), vb = val(b);
      if (typeof va === 'string' && typeof vb === 'string') return va.localeCompare(vb) * econSort.dir;
      return ((va as number) - (vb as number)) * econSort.dir;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, econSort]);

  const billRows = useMemo(() => {
    const rows = [...active.customers];
    switch (billSort) {
      case 'dollar': return rows.sort((a, b) => b.billDollarChange - a.billDollarChange);
      case 'pct': return rows.sort((a, b) => b.billPercentChange - a.billPercentChange);
      case 'proposed': return rows.sort((a, b) => b.revenue - a.revenue);
      case 'name': return rows.sort((a, b) => a.customer.name.localeCompare(b.customer.name));
    }
  }, [active, billSort]);
  const billMax = Math.max(1, ...active.customers.map((c) => Math.abs(c.billDollarChange)));
  const more = active.customers.filter((c) => c.billDollarChange > 0.005).length;
  const less = active.customers.filter((c) => c.billDollarChange < -0.005).length;
  const flat = active.customers.length - more - less;

  const selectedRow = active.customers.find((c) => c.customer.id === selectedId) ?? active.customers[0];
  const base = ORIGINAL_BUSINESS.summary;
  const L = ORIGINAL_BUSINESS.largestLossCustomer;

  const setTierVal = (group: 'subFees' | 'baseFees' | 'included', tier: Tier, v: number) =>
    setAssumptions((a) => {
      if (group === 'subFees') return { ...a, subscription: { tierFees: { ...a.subscription.tierFees, [tier]: v } } };
      if (group === 'baseFees') return { ...a, hybrid: { ...a.hybrid, baseFees: { ...a.hybrid.baseFees, [tier]: v } } };
      return { ...a, hybrid: { ...a.hybrid, includedRequests: { ...a.hybrid.includedRequests, [tier]: v } } };
    });

  const SortTh = ({ k, children, right }: { k: EconSortKey; children: ReactNode; right?: boolean }) => {
    const on = econSort.key === k;
    return (
      <th className={cx('py-3 px-2 font-medium align-bottom', right ? 'text-right' : 'text-left')} aria-sort={on ? (econSort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
        <button
          data-testid={`sort-econ-${k}`}
          onClick={() => setEconSort((s) => ({ key: k, dir: s.key === k ? ((s.dir * -1) as 1 | -1) : k === 'name' || k === 'tier' ? 1 : -1 }))}
          className={cx('inline-flex items-center gap-1 text-[10.5px] uppercase tracking-[0.1em] leading-tight hover:text-foreground', right && 'justify-end', on ? 'text-foreground' : 'text-muted-foreground')}
        >
          {children}
          {on && (econSort.dir === 1 ? <ArrowUp className="h-3 w-3 shrink-0" /> : <ArrowDown className="h-3 w-3 shrink-0" />)}
        </button>
      </th>
    );
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-5 md:px-10">
        {/* Header */}
        <header className="pt-10 md:pt-16 pb-14 border-b border-border">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Strata AI <span className="mx-2 text-border">/</span> Unit Economics &amp; Pricing Review
            </div>
            <div className="flex items-center gap-3">
              {isModified && (
                <span data-testid="status-modified" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Scenario differs from defaults
                </span>
              )}
              <button
                data-testid="button-reset"
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-md border border-input bg-card px-3.5 py-2 text-sm font-medium hover:border-primary hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset assumptions
              </button>
            </div>
          </div>
          <h1 className="mt-12 font-serif text-5xl md:text-7xl leading-[1.02] tracking-tight">The Cost of Growth</h1>
          <p className="mt-6 max-w-2xl font-serif text-xl md:text-2xl leading-snug text-foreground/80">
            Revenue tells you who your biggest customers are. Cost to serve tells you whether they’re worth growing.
          </p>
          <div className="mt-10 grid gap-x-8 gap-y-2 text-sm text-muted-foreground sm:grid-cols-3 max-w-3xl">
            <p><span className="text-foreground font-medium">The finding.</span> Flat tiers let the heaviest users consume more compute than they pay for.</p>
            <p><span className="text-foreground font-medium">The test.</span> Three pricing structures, priced on identical demand.</p>
            <p><span className="text-foreground font-medium">The boundary.</span> No churn or elasticity is modeled. Validate before acting.</p>
          </div>
        </header>

        {/* Original business */}
        <section className="py-16 border-b border-border" aria-labelledby="orig">
          <SectionHead
            num="Baseline"
            title="Original business"
            lede="Fixed at original subscription fees, 1.0× usage and 1.0× inference cost. This baseline never moves; every scenario below is measured against it."
          />
          <div className="md:ml-[120px] md:pl-0">
            <div className="rounded-md border border-dashed border-border bg-secondary/40 px-5">
              <div className="flex items-center justify-between border-b border-border py-2.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                <span>Locked baseline</span><span className="num normal-case tracking-normal">Subscription · 1.0× · 1.0×</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 divide-border">
                <Metric testId="text-base-revenue" label="Monthly revenue" value={formatCurrency(base.totalRevenue)} />
                <Metric testId="text-base-gp" label="Monthly gross profit" value={formatCurrency(base.totalGrossProfit)} negative={base.totalGrossProfit < 0} />
                <Metric testId="text-base-gm" label="Gross margin" value={formatMargin(base.grossMargin)} />
                <Metric testId="text-base-unprofitable" label="Unprofitable customers" value={`${base.unprofitableCount} of ${base.customers.length}`} negative={base.unprofitableCount > 0}
                  sub={<span className="num">{formatCurrency(ORIGINAL_BUSINESS.totalLossFromUnprofitable)}/mo combined</span>} />
              </div>
            </div>

            <div className="mt-10 grid gap-8 md:grid-cols-[1.1fr_1fr] border-l-2 border-destructive pl-6" data-testid="callout-largest-loss">
              <div>
                <div className="text-[11px] uppercase tracking-[0.14em] loss">Finding · largest monthly gross loss</div>
                <h3 className="mt-2 font-serif text-2xl md:text-3xl">{L.customer.name}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                  The biggest {L.customer.tier} account by usage pays the same {formatCurrency(L.revenue)} flat fee as every other {L.customer.tier} customer, but sends{' '}
                  <span className="num text-foreground">{formatRequests(L.monthlyRequests)}</span> requests a month. Inference alone costs{' '}
                  <span className="num text-foreground">{formatCurrency(L.inferenceCost)}</span>, more than the account bills. The top-line logo is a margin liability.
                </p>
              </div>
              <dl className="num text-sm">
                {[
                  ['Monthly revenue', formatCurrency(L.revenue)],
                  ['Monthly requests', formatRequests(L.monthlyRequests)],
                  ['Inference cost', formatCurrency(-L.inferenceCost)],
                  ['Infrastructure cost', formatCurrency(-L.infrastructureCost)],
                  ['Total cost to serve', formatCurrency(L.totalCostToServe)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-border py-2">
                    <dt className="font-sans text-muted-foreground">{k}</dt><dd>{v}</dd>
                  </div>
                ))}
                <div className="flex justify-between py-2.5 font-medium loss">
                  <dt className="font-sans">Gross profit / margin</dt>
                  <dd data-testid="text-largest-loss">{formatCurrency(L.grossProfit)} · {formatMargin(L.grossMargin)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* 1. Customer economics */}
        <section className="py-16 border-b border-border">
          <SectionHead num="01" title="Customer economics" lede="Every account’s revenue against what it costs to serve. Select a row to see where its margin goes." />
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Viewing</span>
            <span data-testid="text-active-scenario" className="num rounded border border-primary/30 bg-accent px-2 py-0.5 text-[13px] text-accent-foreground">{scenarioLabel}</span>
          </div>
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="overflow-x-auto rounded-md border border-border bg-card">
              <table className="w-full min-w-[580px] text-[13px]">
                <thead className="border-b border-border">
                  <tr>
                    <SortTh k="name">Customer</SortTh>
                    <SortTh k="tier">Tier</SortTh>
                    <SortTh k="requests" right>Requests</SortTh>
                    <SortTh k="revenue" right>Revenue</SortTh>
                    <SortTh k="cost" right>Cost to serve</SortTh>
                    <SortTh k="gp" right>Gross profit</SortTh>
                    <SortTh k="gm" right>Margin</SortTh>
                  </tr>
                </thead>
                <tbody>
                  {econRows.map((r) => {
                    const sel = r.customer.id === selectedRow.customer.id;
                    return (
                      <tr
                        key={r.customer.id}
                        data-testid={`row-customer-${r.customer.id}`}
                        tabIndex={0}
                        onClick={() => setSelectedId(r.customer.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(r.customer.id); } }}
                        className={cx('cursor-pointer border-b border-border/70 transition-colors outline-none focus-visible:bg-accent/60',
                          sel ? 'bg-accent/70' : r.isUnprofitable ? 'bg-destructive/[0.04] hover:bg-destructive/[0.07]' : 'hover:bg-secondary/60')}
                      >
                        <td className={cx('py-2.5 pl-3 pr-2 font-medium', sel && 'shadow-[inset_2px_0_0_hsl(var(--primary))]')}>{r.customer.name}</td>
                        <td className="py-2.5 px-2 text-muted-foreground">{r.customer.tier}</td>
                        <td className="num py-2.5 px-2 text-right whitespace-nowrap">{formatRequests(r.monthlyRequests)}</td>
                        <td className="num py-2.5 px-2 text-right whitespace-nowrap">{formatCurrency(r.revenue)}</td>
                        <td className="num py-2.5 px-2 text-right whitespace-nowrap">{formatCurrency(r.totalCostToServe)}</td>
                        <td className={cx('num py-2.5 px-2 text-right whitespace-nowrap', r.grossProfit < -1e-9 && 'loss')}>{formatCurrency(r.grossProfit)}</td>
                        <td className={cx('num py-2.5 pl-2 pr-3 text-right whitespace-nowrap', r.grossMargin !== null && r.grossMargin < 0 && 'loss')}>{formatMargin(r.grossMargin)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-foreground/70 font-medium" data-testid="row-portfolio-total">
                    <td className="py-3 pl-3 pr-2">Portfolio total</td>
                    <td className="py-3 px-2 text-muted-foreground text-xs whitespace-nowrap">{active.unprofitableCount} unprofitable</td>
                    <td className="num py-3 px-2 text-right whitespace-nowrap">{formatRequests(active.totalRequests)}</td>
                    <td className="num py-3 px-2 text-right whitespace-nowrap">{formatCurrency(active.totalRevenue)}</td>
                    <td className="num py-3 px-2 text-right whitespace-nowrap">{formatCurrency(active.totalCostToServe)}</td>
                    <td className={cx('num py-3 px-2 text-right whitespace-nowrap', active.totalGrossProfit < 0 && 'loss')}>{formatCurrency(active.totalGrossProfit)}</td>
                    <td className={cx('num py-3 pl-2 pr-3 text-right whitespace-nowrap', (active.grossMargin ?? 0) < 0 && 'loss')}>{formatMargin(active.grossMargin)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <aside className="lg:sticky lg:top-6 self-start" data-testid="panel-waterfall">
              <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Margin waterfall</div>
              <h3 className="mt-1 font-serif text-2xl">{selectedRow.customer.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {selectedRow.customer.tier} · {selectedRow.customer.usageProfile} usage · <span className="num">{formatRequests(selectedRow.monthlyRequests)}</span> requests/mo
              </p>
              <div className="mt-5"><Waterfall row={selectedRow} /></div>
              <div className={cx('mt-3 flex justify-between border-t border-border pt-3 text-sm', selectedRow.isUnprofitable && 'loss')}>
                <span>{selectedRow.isUnprofitable ? 'Loses money every month' : 'Gross margin'}</span>
                <span className="num">{formatMargin(selectedRow.grossMargin)}</span>
              </div>
              {structure === 'hybrid' && (
                <p className="mt-2 text-xs text-muted-foreground num">
                  Base {formatCurrency(selectedRow.baseRevenue)} + overage {formatCurrency(selectedRow.usageRevenue)} on {formatRequests(selectedRow.overageRequests)} requests
                </p>
              )}
            </aside>
          </div>
        </section>

        {/* 2. Pricing experiment */}
        <section className="py-16 border-b border-border">
          <SectionHead
            num="02"
            title="Pricing experiment"
            lede="Same customers, same demand, three ways to charge for it. Select a structure to make it the active scenario for every section of this review."
          />

          <div className="grid gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-3" role="radiogroup" aria-label="Pricing structure">
            {STRUCTURES.map((id) => {
              const s: ScenarioSummary = scenarios[id];
              const on = id === structure;
              const dGP = s.totalGrossProfit - base.totalGrossProfit;
              return (
                <button
                  key={id}
                  role="radio"
                  aria-checked={on}
                  data-testid={`card-structure-${id}`}
                  onClick={() => setStructure(id)}
                  className={cx('relative text-left p-6 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50',
                    on ? 'bg-card' : 'bg-secondary/50 hover:bg-card/70')}
                >
                  {on && <span className="absolute inset-x-0 top-0 h-[3px] bg-primary" />}
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-xl">{s.label}</span>
                    <span className={cx('text-[10px] uppercase tracking-[0.14em]', on ? 'text-primary' : 'text-muted-foreground')}>{on ? 'Active' : 'Select'}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground min-h-[2.5em]">{PRICING_STRUCTURE_META[id].summary}</p>
                  <dl className="mt-4 text-sm">
                    {[
                      ['Revenue', formatCurrency(s.totalRevenue), false],
                      ['Gross profit', formatCurrency(s.totalGrossProfit), s.totalGrossProfit < 0],
                      ['Gross margin', formatMargin(s.grossMargin), (s.grossMargin ?? 0) < 0],
                      ['Unprofitable', `${s.unprofitableCount} of ${s.customers.length}`, s.unprofitableCount > 0],
                    ].map(([k, v, neg]) => (
                      <div key={k as string} className="flex justify-between border-b border-border/70 py-1.5">
                        <dt className="text-muted-foreground">{k}</dt>
                        <dd className={cx('num', neg && 'loss')} data-testid={`text-${id}-${(k as string).toLowerCase().replace(' ', '-')}`}>{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className={cx('num mt-3 text-xs', dGP < -0.005 ? 'loss' : 'text-muted-foreground')}>
                    {formatSignedCurrency(dGP)}/mo gross profit vs original
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_2fr]">
            <div>
              <h3 className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Global multipliers</h3>
              <p className="mt-1 text-xs text-muted-foreground">Applied to all three structures. Infrastructure stays fixed.</p>
              {([
                ['usageMultiplier', 'Usage multiplier', 'Scales monthly requests per customer'],
                ['inferenceCostMultiplier', 'Inference-cost multiplier', 'Scales model cost per request'],
              ] as const).map(([key, label, hint]) => (
                <div key={key} className="mt-6">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-medium">{label}</span>
                    <span className="num text-sm text-primary">{formatMultiplier(multipliers[key])}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{hint}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <input
                      type="range" min={0} max={3} step={0.05}
                      className="cog-range"
                      data-testid={`slider-${key}`}
                      aria-label={label}
                      value={Math.min(3, multipliers[key])}
                      onChange={(e) => setMultipliers((m) => ({ ...m, [key]: sanitizeNonNegative(Number(e.target.value), 1) }))}
                    />
                    <div className="w-24 shrink-0">
                      <NumberField label="" ariaLabel={`${label} value`} testId={`input-${key}`} value={multipliers[key]} step={0.05} suffix="×"
                        onChange={(v) => setMultipliers((m) => ({ ...m, [key]: v }))} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <fieldset>
                <legend className="font-serif text-lg">Subscription</legend>
                <p className="mt-1 text-xs text-muted-foreground">Monthly fee by tier. No usage overage.</p>
                <div className="mt-4 space-y-3">
                  {TIERS.map((t) => (
                    <NumberField key={t} label={t} prefix="$" testId={`input-sub-${t}`} value={assumptions.subscription.tierFees[t]} onChange={(v) => setTierVal('subFees', t, v)} />
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="font-serif text-lg">Usage-based</legend>
                <p className="mt-1 text-xs text-muted-foreground">Proportional billing. No base fee or minimum.</p>
                <div className="mt-4">
                  <NumberField label="Price per 1,000 requests" prefix="$" step={0.5} testId="input-usage-price"
                    value={assumptions.usage.pricePerThousandRequests}
                    onChange={(v) => setAssumptions((a) => ({ ...a, usage: { pricePerThousandRequests: v } }))} />
                </div>
              </fieldset>
              <fieldset>
                <legend className="font-serif text-lg">Hybrid</legend>
                <p className="mt-1 text-xs text-muted-foreground">Base fee plus allowance. Overage billed proportionally, never rounded up.</p>
                <div className="mt-4 space-y-3">
                  {TIERS.map((t) => (
                    <div key={t} className="grid grid-cols-2 gap-2">
                      <NumberField label={`${t} base`} prefix="$" testId={`input-hybrid-base-${t}`} value={assumptions.hybrid.baseFees[t]} onChange={(v) => setTierVal('baseFees', t, v)} />
                      <NumberField label="Included req." step={1000} testId={`input-hybrid-included-${t}`} value={assumptions.hybrid.includedRequests[t]} onChange={(v) => setTierVal('included', t, v)} />
                    </div>
                  ))}
                  <NumberField label="Overage per 1,000 requests" prefix="$" step={0.5} testId="input-hybrid-overage"
                    value={assumptions.hybrid.overagePricePerThousand}
                    onChange={(v) => setAssumptions((a) => ({ ...a, hybrid: { ...a.hybrid, overagePricePerThousand: v } }))} />
                </div>
              </fieldset>
            </div>
          </div>
        </section>

        {/* 3. Who pays more */}
        <section className="py-16 border-b border-border">
          <SectionHead num="03" title="Who pays more?" lede={<>Each customer’s proposed bill under <span className="text-foreground">{active.label}</span> against their original subscription bill.</>} />
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <p data-testid="text-bill-summary" className="text-sm">
              <span className="num font-medium">{more}</span> pay more · <span className="num font-medium">{less}</span> pay less · <span className="num font-medium">{flat}</span> unchanged
            </p>
            <div className="flex flex-wrap gap-1 text-xs" role="group" aria-label="Sort bills">
              {([['dollar', '$ change'], ['pct', '% change'], ['proposed', 'Proposed bill'], ['name', 'Customer']] as const).map(([k, l]) => (
                <button key={k} data-testid={`sort-bill-${k}`} onClick={() => setBillSort(k)}
                  className={cx('rounded border px-2.5 py-1 transition-colors', billSort === k ? 'border-primary bg-accent text-accent-foreground' : 'border-border text-muted-foreground hover:text-foreground')}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-border text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                <tr>
                  <th className="py-2.5 pr-3 text-left font-medium">Customer</th>
                  <th className="py-2.5 px-3 text-right font-medium">Original</th>
                  <th className="py-2.5 px-3 text-right font-medium">Proposed</th>
                  <th className="py-2.5 px-3 text-right font-medium">Change</th>
                  <th className="py-2.5 px-3 text-right font-medium">%</th>
                  <th className="py-2.5 pl-4 font-medium w-[32%]"><span className="flex justify-between"><span>Decrease</span><span>Increase</span></span></th>
                </tr>
              </thead>
              <tbody>
                {billRows.map((r) => {
                  const d = r.billDollarChange;
                  const w = (Math.abs(d) / billMax) * 50;
                  const steep = isSteepBillIncrease(r.billPercentChange);
                  return (
                    <tr key={r.customer.id} className="border-b border-border/70" data-testid={`row-bill-${r.customer.id}`}>
                      <td className="py-2.5 pr-3"><span className="font-medium">{r.customer.name}</span> <span className="text-xs text-muted-foreground">{r.customer.tier}</span></td>
                      <td className="num py-2.5 px-3 text-right text-muted-foreground">{formatCurrency(r.originalBill)}</td>
                      <td className="num py-2.5 px-3 text-right">{formatCurrency(r.revenue)}</td>
                      <td className={cx('num py-2.5 px-3 text-right', steep ? 'loss' : d > 0.005 ? 'text-foreground' : d < -0.005 ? 'text-primary' : 'text-muted-foreground')}>{formatSignedCurrency(d)}</td>
                      <td className={cx('num py-2.5 px-3 text-right', steep ? 'loss' : 'text-muted-foreground')}>{formatPercentChange(r.billPercentChange)}</td>
                      <td className="py-2.5 pl-4">
                        <div className="relative h-3">
                          <div className="absolute left-1/2 top-[-4px] bottom-[-4px] w-px bg-foreground/40" />
                          {Math.abs(d) > 0.005 && (
                            <div
                              className={cx('absolute top-0 h-3 rounded-[1px]', d > 0 ? (steep ? 'bg-destructive/80' : 'bg-foreground/55') : 'bg-primary/80')}
                              style={d > 0 ? { left: '50%', width: `${w}%` } : { right: '50%', width: `${w}%` }}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p data-testid="text-bill-threshold-footnote" className="mt-3 text-xs text-muted-foreground">Increases of 50% or more are highlighted in red as an illustrative review threshold for retention and willingness-to-pay validation, not a predicted churn trigger.</p>
        </section>

        {/* 4. Finance takeaway */}
        <section className="py-16 border-b border-border" data-testid="section-takeaway">
          <SectionHead num="04" title="Finance takeaway" />
          <div className="md:ml-[120px]">
            <div className="text-[11px] uppercase tracking-[0.14em] text-primary">Selected: {takeaway.selectedStructureLabel}</div>
            <p data-testid="text-takeaway-headline" className="mt-3 max-w-3xl font-serif text-2xl md:text-3xl leading-snug">{takeaway.headline}</p>

            <div
              data-testid="panel-takeaway-kpis"
              className="mt-8 rounded-md border border-border bg-card px-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                <span>Selected scenario KPIs</span>
                <span className="num normal-case tracking-normal text-primary">{scenarioLabel}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6">
                {takeaway.kpis.map((kpi) => (
                  <Metric
                    key={kpi.id}
                    testId={`text-takeaway-kpi-${kpi.id}`}
                    label={kpi.label}
                    value={kpi.value}
                    negative={kpi.tone === 'warning'}
                    sub={<span className="num">{kpi.sublabel}</span>}
                  />
                ))}
              </div>
            </div>

            <div className="mt-10 max-w-3xl" data-testid="panel-executive-summary">
              <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Executive summary
              </div>
              <div className="mt-4 space-y-5 text-[15px] leading-relaxed">
                {[
                  ['Profit comparison', takeaway.profitLeaderParagraph],
                  ['Customer bill impact', takeaway.billImpactParagraph],
                ].map(([k, v]) => (
                  <div key={k} className="grid gap-1 md:grid-cols-[180px_1fr] border-t border-border pt-4">
                    <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground pt-1">{k}</div>
                    <p className="tnum">{v}</p>
                  </div>
                ))}

                {takeaway.steepIncreaseReview && (
                  <div
                    data-testid="callout-steep-increase-review"
                    className="rounded-r-md border-l-2 border-destructive bg-destructive/[0.04] px-5 py-4"
                  >
                    <div className="text-[11px] uppercase tracking-[0.14em] font-medium loss">
                      50%+ bill increase review
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2 border-y border-destructive/20 py-2.5 text-sm">
                      <div>
                        <span className="text-xs text-muted-foreground">Flagged accounts </span>
                        <span data-testid="text-steep-increase-count" className="num font-medium loss">
                          {takeaway.steepIncreaseReview.affectedCount} of {takeaway.steepIncreaseReview.totalCustomerCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Share of original monthly revenue </span>
                        <span data-testid="text-steep-increase-revenue-share" className="num font-medium loss">
                          {formatPercentShare(takeaway.steepIncreaseReview.originalRevenueShare)}
                        </span>{' '}
                        <span className="num text-xs text-muted-foreground">
                          ({formatCurrency(takeaway.steepIncreaseReview.affectedOriginalRevenue)} of {formatCurrency(takeaway.steepIncreaseReview.totalOriginalRevenue)})
                        </span>
                      </div>
                    </div>
                    <p data-testid="text-steep-increase-paragraph" className="mt-3 tnum text-[14.5px] leading-relaxed text-foreground">
                      {takeaway.steepIncreaseReview.paragraph}
                    </p>
                  </div>
                )}

                {[
                  ['Unprofitable accounts', takeaway.unprofitableParagraph],
                  ['What must be validated', takeaway.validationParagraph],
                ].map(([k, v]) => (
                  <div key={k} className="grid gap-1 md:grid-cols-[180px_1fr] border-t border-border pt-4">
                    <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground pt-1">{k}</div>
                    <p className="tnum">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Methodology */}
        <section className="py-12">
          <button
            data-testid="button-toggle-methodology"
            aria-expanded={methodOpen}
            onClick={() => setMethodOpen((o) => !o)}
            className="flex w-full items-center justify-between border-y border-border py-4 text-left"
          >
            <span className="font-serif text-xl">Assumptions &amp; methodology</span>
            <ChevronDown className={cx('h-4 w-4 transition-transform', methodOpen && 'rotate-180')} />
          </button>
          {methodOpen && (
            <div className="grid gap-8 pt-8 text-sm leading-relaxed text-muted-foreground md:grid-cols-2" data-testid="panel-methodology">
              <div><h4 className="mb-1 font-medium text-foreground">Dataset</h4>A hypothetical set of 12 customers across Starter ($1,200), Growth ($4,500) and Enterprise ($12,000) tiers, each with a light, typical or heavy usage mix.</div>
              <div><h4 className="mb-1 font-medium text-foreground">Cost and margin definitions</h4>Requests = original monthly requests × usage multiplier. Inference cost = requests × cost per request × inference-cost multiplier. Total cost to serve = inference + fixed infrastructure. Gross profit = revenue − cost to serve. Gross margin = gross profit ÷ revenue, shown as N/A when revenue is $0.</div>
              <div><h4 className="mb-1 font-medium text-foreground">Default prices</h4>Subscription holds the original fees. Usage-based is set at $19 per 1,000 requests to show compute alignment against base-revenue erosion on light users. Hybrid uses modest base discounts ($1,000 / $3,800 / $10,000) with 75k / 250k / 700k included requests and $18 per 1,000 proportional overage, so neither structure is rigged to win.</div>
              <div><h4 className="mb-1 font-medium text-foreground">Fixed infrastructure</h4>Infrastructure cost stays constant per customer as multipliers change. Requests included in a hybrid allowance still incur inference cost.</div>
              <div className="md:col-span-2"><h4 className="mb-1 font-medium text-foreground">No modeled customer behavior</h4>Customer count and usage stay constant across structures unless the usage multiplier changes. The model does not invent churn, conversion or demand elasticity.</div>
            </div>
          )}
          <p className="mt-12 text-xs text-muted-foreground">Strata AI is a fictional company. All figures are illustrative.</p>
        </section>
      </div>
    </div>
  );
}
