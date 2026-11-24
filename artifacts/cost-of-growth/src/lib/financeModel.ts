export type Tier = 'Starter' | 'Growth' | 'Enterprise';

export type UsageProfile = 'Light' | 'Typical' | 'Heavy';

export type PricingStructureId = 'subscription' | 'usage' | 'hybrid';

export interface CustomerRecord {
  readonly id: string;
  readonly name: string;
  readonly tier: Tier;
  readonly usageProfile: UsageProfile;
  readonly originalMonthlyFee: number;
  readonly originalMonthlyRequests: number;
  readonly inferenceCostPerRequest: number;
  readonly infrastructureCost: number;
}

export interface TierFeeMap {
  Starter: number;
  Growth: number;
  Enterprise: number;
}

export interface SubscriptionPricing {
  tierFees: TierFeeMap;
}

export interface UsagePricing {
  pricePerThousandRequests: number;
}

export interface HybridPricing {
  baseFees: TierFeeMap;
  includedRequests: TierFeeMap;
  overagePricePerThousand: number;
}

export interface PricingAssumptions {
  subscription: SubscriptionPricing;
  usage: UsagePricing;
  hybrid: HybridPricing;
}

export interface GlobalMultipliers {
  usageMultiplier: number;
  inferenceCostMultiplier: number;
}

export interface CustomerEconomics {
  customer: CustomerRecord;
  monthlyRequests: number;
  revenue: number;
  baseRevenue: number;
  usageRevenue: number;
  overageRequests: number;
  inferenceCost: number;
  infrastructureCost: number;
  totalCostToServe: number;
  grossProfit: number;
  grossMargin: number | null;
  isUnprofitable: boolean;
  originalBill: number;
  billDollarChange: number;
  billPercentChange: number;
}

export interface ScenarioSummary {
  id: PricingStructureId;
  label: string;
  shortLabel: string;
  totalRevenue: number;
  totalInferenceCost: number;
  totalInfrastructureCost: number;
  totalCostToServe: number;
  totalGrossProfit: number;
  grossMargin: number | null;
  totalRequests: number;
  unprofitableCount: number;
  unprofitableCustomers: CustomerEconomics[];
  customers: CustomerEconomics[];
}

export interface OriginalBusinessBaseline {
  summary: ScenarioSummary;
  largestLossCustomer: CustomerEconomics;
  totalLossFromUnprofitable: number;
}

export const STEEP_BILL_INCREASE_THRESHOLD = 0.5;

export interface SteepBillIncreaseReview {
  threshold: number;
  affectedCustomers: CustomerEconomics[];
  affectedCount: number;
  totalCustomerCount: number;
  affectedOriginalRevenue: number;
  totalOriginalRevenue: number;
  originalRevenueShare: number;
  paragraph: string;
}

export type FinanceTakeawayKpiId =
  | 'gross-profit'
  | 'paying-more'
  | 'unprofitable'
  | 'steep-increase-review';

export interface FinanceTakeawayKpi {
  id: FinanceTakeawayKpiId;
  label: string;
  value: string;
  sublabel: string;
  tone: 'default' | 'warning';
}

export interface FinanceTakeaway {
  selectedStructureLabel: string;
  headline: string;
  kpis: FinanceTakeawayKpi[];
  profitLeaderParagraph: string;
  billImpactParagraph: string;
  steepIncreaseReview: SteepBillIncreaseReview | null;
  unprofitableParagraph: string;
  validationParagraph: string;
}

export const TIERS: readonly Tier[] = Object.freeze([
  'Starter',
  'Growth',
  'Enterprise',
]);

export const PRICING_STRUCTURE_META: Record<
  PricingStructureId,
  { label: string; shortLabel: string; summary: string }
> = {
  subscription: {
    label: 'Subscription',
    shortLabel: 'Subscription',
    summary: 'Flat monthly fee by tier with no usage overage charge.',
  },
  usage: {
    label: 'Usage-based',
    shortLabel: 'Usage-based',
    summary: 'Proportional fee per 1,000 requests with no base fee or minimum.',
  },
  hybrid: {
    label: 'Hybrid',
    shortLabel: 'Hybrid',
    summary: 'Monthly base fee with tier request allowances plus proportional overages.',
  },
};

export const ORIGINAL_TIER_FEES: Readonly<TierFeeMap> = Object.freeze({
  Starter: 1200,
  Growth: 4500,
  Enterprise: 12000,
});

const RAW_CUSTOMERS: readonly CustomerRecord[] = [
  {
    id: 'alder-co',
    name: 'Alder & Co.',
    tier: 'Starter',
    usageProfile: 'Light',
    originalMonthlyFee: ORIGINAL_TIER_FEES.Starter,
    originalMonthlyRequests: 24000,
    inferenceCostPerRequest: 0.009,
    infrastructureCost: 140,
  },
  {
    id: 'birchline-health',
    name: 'Birchline Health',
    tier: 'Starter',
    usageProfile: 'Light',
    originalMonthlyFee: ORIGINAL_TIER_FEES.Starter,
    originalMonthlyRequests: 36000,
    inferenceCostPerRequest: 0.01,
    infrastructureCost: 150,
  },
  {
    id: 'cobalt-studio',
    name: 'Cobalt Studio',
    tier: 'Starter',
    usageProfile: 'Typical',
    originalMonthlyFee: ORIGINAL_TIER_FEES.Starter,
    originalMonthlyRequests: 68000,
    inferenceCostPerRequest: 0.009,
    infrastructureCost: 160,
  },
  {
    id: 'redwood-media',
    name: 'Redwood Media',
    tier: 'Starter',
    usageProfile: 'Heavy',
    originalMonthlyFee: ORIGINAL_TIER_FEES.Starter,
    originalMonthlyRequests: 165000,
    inferenceCostPerRequest: 0.01,
    infrastructureCost: 180,
  },
  {
    id: 'halcyon-retail',
    name: 'Halcyon Retail',
    tier: 'Growth',
    usageProfile: 'Light',
    originalMonthlyFee: ORIGINAL_TIER_FEES.Growth,
    originalMonthlyRequests: 85000,
    inferenceCostPerRequest: 0.01,
    infrastructureCost: 320,
  },
  {
    id: 'kestrel-financial',
    name: 'Kestrel Financial',
    tier: 'Growth',
    usageProfile: 'Typical',
    originalMonthlyFee: ORIGINAL_TIER_FEES.Growth,
    originalMonthlyRequests: 180000,
    inferenceCostPerRequest: 0.011,
    infrastructureCost: 360,
  },
  {
    id: 'meridian-bio',
    name: 'Meridian Bio',
    tier: 'Growth',
    usageProfile: 'Typical',
    originalMonthlyFee: ORIGINAL_TIER_FEES.Growth,
    originalMonthlyRequests: 260000,
    inferenceCostPerRequest: 0.01,
    infrastructureCost: 380,
  },
  {
    id: 'vanguard-legal',
    name: 'Vanguard Legal',
    tier: 'Growth',
    usageProfile: 'Heavy',
    originalMonthlyFee: ORIGINAL_TIER_FEES.Growth,
    originalMonthlyRequests: 540000,
    inferenceCostPerRequest: 0.011,
    infrastructureCost: 420,
  },
  {
    id: 'crestview-capital',
    name: 'Crestview Capital',
    tier: 'Enterprise',
    usageProfile: 'Light',
    originalMonthlyFee: ORIGINAL_TIER_FEES.Enterprise,
    originalMonthlyRequests: 220000,
    inferenceCostPerRequest: 0.011,
    infrastructureCost: 700,
  },
  {
    id: 'solstice-energy',
    name: 'Solstice Energy',
    tier: 'Enterprise',
    usageProfile: 'Typical',
    originalMonthlyFee: ORIGINAL_TIER_FEES.Enterprise,
    originalMonthlyRequests: 460000,
    inferenceCostPerRequest: 0.011,
    infrastructureCost: 780,
  },
  {
    id: 'ironclad-mfg',
    name: 'Ironclad Manufacturing',
    tier: 'Enterprise',
    usageProfile: 'Typical',
    originalMonthlyFee: ORIGINAL_TIER_FEES.Enterprise,
    originalMonthlyRequests: 720000,
    inferenceCostPerRequest: 0.011,
    infrastructureCost: 820,
  },
  {
    id: 'northstar-logistics',
    name: 'Northstar Logistics',
    tier: 'Enterprise',
    usageProfile: 'Heavy',
    originalMonthlyFee: ORIGINAL_TIER_FEES.Enterprise,
    originalMonthlyRequests: 1450000,
    inferenceCostPerRequest: 0.012,
    infrastructureCost: 850,
  },
];

export const ORIGINAL_CUSTOMERS: readonly CustomerRecord[] = Object.freeze(
  RAW_CUSTOMERS.map((customer) => Object.freeze({ ...customer })),
);

export function createDefaultAssumptions(): PricingAssumptions {
  return {
    subscription: {
      tierFees: {
        Starter: ORIGINAL_TIER_FEES.Starter,
        Growth: ORIGINAL_TIER_FEES.Growth,
        Enterprise: ORIGINAL_TIER_FEES.Enterprise,
      },
    },
    usage: {
      pricePerThousandRequests: 19,
    },
    hybrid: {
      baseFees: {
        Starter: 1000,
        Growth: 3800,
        Enterprise: 10000,
      },
      includedRequests: {
        Starter: 75000,
        Growth: 250000,
        Enterprise: 700000,
      },
      overagePricePerThousand: 18,
    },
  };
}

export function createDefaultMultipliers(): GlobalMultipliers {
  return {
    usageMultiplier: 1.0,
    inferenceCostMultiplier: 1.0,
  };
}

export function sanitizeNonNegative(value: number, fallback = 0): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return fallback;
  }
  return value;
}

export function sanitizeAssumptions(
  assumptions: PricingAssumptions,
): PricingAssumptions {
  return {
    subscription: {
      tierFees: {
        Starter: sanitizeNonNegative(assumptions.subscription.tierFees.Starter),
        Growth: sanitizeNonNegative(assumptions.subscription.tierFees.Growth),
        Enterprise: sanitizeNonNegative(
          assumptions.subscription.tierFees.Enterprise,
        ),
      },
    },
    usage: {
      pricePerThousandRequests: sanitizeNonNegative(
        assumptions.usage.pricePerThousandRequests,
      ),
    },
    hybrid: {
      baseFees: {
        Starter: sanitizeNonNegative(assumptions.hybrid.baseFees.Starter),
        Growth: sanitizeNonNegative(assumptions.hybrid.baseFees.Growth),
        Enterprise: sanitizeNonNegative(assumptions.hybrid.baseFees.Enterprise),
      },
      includedRequests: {
        Starter: sanitizeNonNegative(assumptions.hybrid.includedRequests.Starter),
        Growth: sanitizeNonNegative(assumptions.hybrid.includedRequests.Growth),
        Enterprise: sanitizeNonNegative(
          assumptions.hybrid.includedRequests.Enterprise,
        ),
      },
      overagePricePerThousand: sanitizeNonNegative(
        assumptions.hybrid.overagePricePerThousand,
      ),
    },
  };
}

export function sanitizeMultipliers(
  multipliers: GlobalMultipliers,
): GlobalMultipliers {
  return {
    usageMultiplier: sanitizeNonNegative(multipliers.usageMultiplier, 1.0),
    inferenceCostMultiplier: sanitizeNonNegative(
      multipliers.inferenceCostMultiplier,
      1.0,
    ),
  };
}

const EPSILON = 1e-9;
const TIE_TOLERANCE_DOLLARS = 0.005;

export function isSteepBillIncrease(billPercentChange: number): boolean {
  return (
    Number.isFinite(billPercentChange) &&
    billPercentChange >= STEEP_BILL_INCREASE_THRESHOLD - EPSILON
  );
}

function calculateCustomerCosts(
  customer: CustomerRecord,
  multipliers: GlobalMultipliers,
): {
  monthlyRequests: number;
  inferenceCost: number;
  infrastructureCost: number;
  totalCostToServe: number;
} {
  const monthlyRequests =
    customer.originalMonthlyRequests * multipliers.usageMultiplier;
  const inferenceCost =
    monthlyRequests *
    customer.inferenceCostPerRequest *
    multipliers.inferenceCostMultiplier;
  const infrastructureCost = customer.infrastructureCost;
  const totalCostToServe = inferenceCost + infrastructureCost;

  return {
    monthlyRequests,
    inferenceCost,
    infrastructureCost,
    totalCostToServe,
  };
}

function calculateCustomerRevenue(
  customer: CustomerRecord,
  monthlyRequests: number,
  structure: PricingStructureId,
  assumptions: PricingAssumptions,
): {
  revenue: number;
  baseRevenue: number;
  usageRevenue: number;
  overageRequests: number;
} {
  if (structure === 'subscription') {
    const baseRevenue = assumptions.subscription.tierFees[customer.tier];
    return {
      revenue: baseRevenue,
      baseRevenue,
      usageRevenue: 0,
      overageRequests: 0,
    };
  }

  if (structure === 'usage') {
    const usageRevenue =
      (monthlyRequests / 1000) * assumptions.usage.pricePerThousandRequests;
    return {
      revenue: usageRevenue,
      baseRevenue: 0,
      usageRevenue,
      overageRequests: monthlyRequests,
    };
  }

  const baseRevenue = assumptions.hybrid.baseFees[customer.tier];
  const allowance = assumptions.hybrid.includedRequests[customer.tier];
  const overageRequests = Math.max(0, monthlyRequests - allowance);
  const usageRevenue =
    (overageRequests / 1000) * assumptions.hybrid.overagePricePerThousand;

  return {
    revenue: baseRevenue + usageRevenue,
    baseRevenue,
    usageRevenue,
    overageRequests,
  };
}

export function calculateScenario(
  structure: PricingStructureId,
  rawAssumptions: PricingAssumptions,
  rawMultipliers: GlobalMultipliers,
): ScenarioSummary {
  const assumptions = sanitizeAssumptions(rawAssumptions);
  const multipliers = sanitizeMultipliers(rawMultipliers);
  const meta = PRICING_STRUCTURE_META[structure];

  const customers: CustomerEconomics[] = ORIGINAL_CUSTOMERS.map((customer) => {
    const {
      monthlyRequests,
      inferenceCost,
      infrastructureCost,
      totalCostToServe,
    } = calculateCustomerCosts(customer, multipliers);

    const { revenue, baseRevenue, usageRevenue, overageRequests } =
      calculateCustomerRevenue(customer, monthlyRequests, structure, assumptions);

    const grossProfit = revenue - totalCostToServe;
    const grossMargin = revenue > EPSILON ? grossProfit / revenue : null;
    const isUnprofitable = grossProfit < -EPSILON;
    const originalBill = customer.originalMonthlyFee;
    const billDollarChange = revenue - originalBill;
    const billPercentChange = billDollarChange / originalBill;

    return {
      customer,
      monthlyRequests,
      revenue,
      baseRevenue,
      usageRevenue,
      overageRequests,
      inferenceCost,
      infrastructureCost,
      totalCostToServe,
      grossProfit,
      grossMargin,
      isUnprofitable,
      originalBill,
      billDollarChange,
      billPercentChange,
    };
  });

  const totalRevenue = customers.reduce((sum, item) => sum + item.revenue, 0);
  const totalInferenceCost = customers.reduce(
    (sum, item) => sum + item.inferenceCost,
    0,
  );
  const totalInfrastructureCost = customers.reduce(
    (sum, item) => sum + item.infrastructureCost,
    0,
  );
  const totalCostToServe = customers.reduce(
    (sum, item) => sum + item.totalCostToServe,
    0,
  );
  const totalGrossProfit = totalRevenue - totalCostToServe;
  const grossMargin =
    totalRevenue > EPSILON ? totalGrossProfit / totalRevenue : null;
  const totalRequests = customers.reduce(
    (sum, item) => sum + item.monthlyRequests,
    0,
  );
  const unprofitableCustomers = customers.filter((item) => item.isUnprofitable);

  return {
    id: structure,
    label: meta.label,
    shortLabel: meta.shortLabel,
    totalRevenue,
    totalInferenceCost,
    totalInfrastructureCost,
    totalCostToServe,
    totalGrossProfit,
    grossMargin,
    totalRequests,
    unprofitableCount: unprofitableCustomers.length,
    unprofitableCustomers,
    customers,
  };
}

export function calculateAllScenarios(
  assumptions: PricingAssumptions,
  multipliers: GlobalMultipliers,
): Record<PricingStructureId, ScenarioSummary> {
  return {
    subscription: calculateScenario('subscription', assumptions, multipliers),
    usage: calculateScenario('usage', assumptions, multipliers),
    hybrid: calculateScenario('hybrid', assumptions, multipliers),
  };
}

function computeOriginalBaseline(): OriginalBusinessBaseline {
  const summary = calculateScenario(
    'subscription',
    createDefaultAssumptions(),
    createDefaultMultipliers(),
  );
  const largestLossCustomer = [...summary.customers].sort(
    (a, b) => a.grossProfit - b.grossProfit,
  )[0];
  const totalLossFromUnprofitable = summary.unprofitableCustomers.reduce(
    (sum, item) => sum + item.grossProfit,
    0,
  );

  return Object.freeze({
    summary,
    largestLossCustomer,
    totalLossFromUnprofitable,
  });
}

export const ORIGINAL_BUSINESS: OriginalBusinessBaseline =
  computeOriginalBaseline();

function formatNameList(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

export function formatCurrency(value: number, decimals = 0): string {
  const safe = Math.abs(value) < 1e-9 ? 0 : value;
  const absFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(safe));
  return safe < 0 ? `−${absFormatted}` : absFormatted;
}

export function formatSignedCurrency(value: number, decimals = 0): string {
  const safe = Math.abs(value) < 0.005 ? 0 : value;
  if (safe === 0) return '$0';
  const absFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(safe));
  return safe > 0 ? `+${absFormatted}` : `−${absFormatted}`;
}

export function formatMargin(margin: number | null): string {
  if (margin === null || !Number.isFinite(margin)) return 'N/A';
  const pct = margin * 100;
  const safe = Math.abs(pct) < 0.05 ? 0 : pct;
  const formatted = `${Math.abs(safe).toFixed(1)}%`;
  return safe < 0 ? `−${formatted}` : formatted;
}

export function formatPercentChange(value: number): string {
  if (!Number.isFinite(value)) return 'N/A';
  const pct = value * 100;
  const safe = Math.abs(pct) < 0.05 ? 0 : pct;
  if (safe === 0) return '0.0%';
  const formatted = `${Math.abs(safe).toFixed(1)}%`;
  return safe > 0 ? `+${formatted}` : `−${formatted}`;
}

export function formatPercentShare(share: number): string {
  if (!Number.isFinite(share)) return 'N/A';
  const pct = share * 100;
  const safe = Math.abs(pct) < 0.05 ? 0 : pct;
  return `${safe.toFixed(1)}%`;
}

export function formatRequests(value: number): string {
  const safe = Math.abs(value) < 1e-9 ? 0 : value;
  if (safe >= 1_000_000) {
    return `${(safe / 1_000_000).toFixed(2)}M`;
  }
  if (safe >= 10_000) {
    return `${Math.round(safe).toLocaleString('en-US')}`;
  }
  return `${Math.round(safe).toLocaleString('en-US')}`;
}

export function formatMultiplier(value: number): string {
  return `${value.toFixed(2).replace(/\.00$/, '.0')}×`;
}

export function calculateSteepBillIncreaseReview(
  summary: ScenarioSummary,
): SteepBillIncreaseReview | null {
  const affectedCustomers = [...summary.customers]
    .filter((c) => isSteepBillIncrease(c.billPercentChange))
    .sort((a, b) => {
      if (Math.abs(b.billPercentChange - a.billPercentChange) > EPSILON) {
        return b.billPercentChange - a.billPercentChange;
      }
      if (
        Math.abs(b.billDollarChange - a.billDollarChange) >
        TIE_TOLERANCE_DOLLARS
      ) {
        return b.billDollarChange - a.billDollarChange;
      }
      return a.customer.name.localeCompare(b.customer.name);
    });

  if (affectedCustomers.length === 0) {
    return null;
  }

  const totalCustomerCount = summary.customers.length;
  const affectedCount = affectedCustomers.length;
  const totalOriginalRevenue = summary.customers.reduce(
    (sum, c) => sum + c.originalBill,
    0,
  );
  const affectedOriginalRevenue = affectedCustomers.reduce(
    (sum, c) => sum + c.originalBill,
    0,
  );
  const originalRevenueShare =
    totalOriginalRevenue > EPSILON
      ? affectedOriginalRevenue / totalOriginalRevenue
      : 0;

  const accountNames = formatNameList(
    affectedCustomers.map((c) => c.customer.name),
  );
  const shareText = formatPercentShare(originalRevenueShare);
  const revenueContext = `${formatCurrency(affectedOriginalRevenue)} of ${formatCurrency(totalOriginalRevenue)}`;
  const isSingle = affectedCount === 1;
  const isAll = affectedCount === totalCustomerCount;

  const countPrefix = isAll
    ? `All ${affectedCount} of ${totalCustomerCount} customers`
    : `${affectedCount} of ${totalCustomerCount} customers`;

  const paragraph = isSingle
    ? `${countPrefix} (${accountNames}) faces a bill increase of 50% or more compared with its original subscription bill, representing ${shareText} of original monthly revenue (${revenueContext}). Flag this account for retention and willingness-to-pay validation. Projected results assume this account stays at unchanged usage; if it leaves, the gross-profit impact depends on the revenue lost and which serving costs (such as variable inference versus fixed infrastructure) can actually be eliminated.`
    : `${countPrefix} (${accountNames}) face bill increases of 50% or more compared with their original subscription bills, representing ${shareText} of original monthly revenue (${revenueContext}). Flag these accounts for retention and willingness-to-pay validation. Projected results assume these accounts stay at unchanged usage; if any of them leave, the gross-profit impact depends on the revenue lost and which serving costs (such as variable inference versus fixed infrastructure) can actually be eliminated.`;

  return {
    threshold: STEEP_BILL_INCREASE_THRESHOLD,
    affectedCustomers,
    affectedCount,
    totalCustomerCount,
    affectedOriginalRevenue,
    totalOriginalRevenue,
    originalRevenueShare,
    paragraph,
  };
}

export function generateFinanceTakeaway(
  scenarios: Record<PricingStructureId, ScenarioSummary>,
  selectedStructure: PricingStructureId,
  multipliers: GlobalMultipliers,
): FinanceTakeaway {
  const ordered: ScenarioSummary[] = [
    scenarios.subscription,
    scenarios.usage,
    scenarios.hybrid,
  ];
  const selected = scenarios[selectedStructure];

  const maxGrossProfit = Math.max(...ordered.map((s) => s.totalGrossProfit));
  const leaders = ordered.filter(
    (s) => Math.abs(s.totalGrossProfit - maxGrossProfit) <= TIE_TOLERANCE_DOLLARS,
  );

  const leaderNames = formatNameList(leaders.map((s) => s.label));
  const selectedIsLeader = leaders.some((s) => s.id === selected.id);
  const multiplierContext =
    Math.abs(multipliers.usageMultiplier - 1) < 1e-6 &&
    Math.abs(multipliers.inferenceCostMultiplier - 1) < 1e-6
      ? 'at baseline 1.0× usage and 1.0× inference costs'
      : `at ${formatMultiplier(multipliers.usageMultiplier)} usage and ${formatMultiplier(multipliers.inferenceCostMultiplier)} inference costs`;

  let profitLeaderParagraph: string;
  let headline: string;

  if (leaders.length === 3) {
    headline = `All three configured structures tie at ${formatCurrency(maxGrossProfit)} monthly gross profit.`;
    profitLeaderParagraph = `Under the prices entered ${multiplierContext}, Subscription, Usage-based, and Hybrid tie for the highest monthly gross profit at ${formatCurrency(maxGrossProfit)} (${formatMargin(selected.grossMargin)} gross margin under ${selected.label}).`;
  } else if (leaders.length === 2) {
    headline = `${leaderNames} tie for highest gross profit (${formatCurrency(maxGrossProfit)}).`;
    if (selectedIsLeader) {
      profitLeaderParagraph = `Under the prices entered ${multiplierContext}, ${leaderNames} tie for the highest monthly gross profit at ${formatCurrency(maxGrossProfit)}. Your selected ${selected.label} structure is tied for the lead at a ${formatMargin(selected.grossMargin)} gross margin.`;
    } else {
      const gap = maxGrossProfit - selected.totalGrossProfit;
      profitLeaderParagraph = `Under the prices entered ${multiplierContext}, ${leaderNames} tie for the highest monthly gross profit at ${formatCurrency(maxGrossProfit)}. Your selected ${selected.label} structure produces ${formatCurrency(selected.totalGrossProfit)} (${formatMargin(selected.grossMargin)} gross margin), trailing the leaders by ${formatCurrency(gap)} per month.`;
    }
  } else {
    const leader = leaders[0];
    const runnerUp = [...ordered]
      .filter((s) => s.id !== leader.id)
      .sort((a, b) => b.totalGrossProfit - a.totalGrossProfit)[0];
    const leadMargin = leader.totalGrossProfit - runnerUp.totalGrossProfit;

    headline = `${leader.label} leads configured scenarios at ${formatCurrency(leader.totalGrossProfit)} monthly gross profit.`;
    if (selectedIsLeader) {
      profitLeaderParagraph = `Under the prices entered ${multiplierContext}, ${selected.label} (selected) produces the highest monthly gross profit at ${formatCurrency(selected.totalGrossProfit)} (${formatMargin(selected.grossMargin)} gross margin), ahead of ${runnerUp.label} by ${formatCurrency(leadMargin)} per month.`;
    } else {
      const gap = leader.totalGrossProfit - selected.totalGrossProfit;
      profitLeaderParagraph = `Under the prices entered ${multiplierContext}, ${leader.label} produces the highest monthly gross profit at ${formatCurrency(leader.totalGrossProfit)} (${formatMargin(leader.grossMargin)} gross margin). Your selected ${selected.label} structure generates ${formatCurrency(selected.totalGrossProfit)} (${formatMargin(selected.grossMargin)} gross margin), ${formatCurrency(gap)} per month below ${leader.label}.`;
    }
  }

  const payingMore = selected.customers.filter(
    (c) => c.billDollarChange > TIE_TOLERANCE_DOLLARS,
  );
  const payingLess = selected.customers.filter(
    (c) => c.billDollarChange < -TIE_TOLERANCE_DOLLARS,
  );
  const unchangedCount =
    selected.customers.length - payingMore.length - payingLess.length;

  let billImpactParagraph: string;
  let payingMoreSublabel: string;

  if (payingMore.length === 0) {
    billImpactParagraph = `Under ${selected.label}, no customers pay more than their original subscription bill (${payingLess.length} pay less and ${unchangedCount} remain unchanged).`;
    payingMoreSublabel =
      payingLess.length > 0 && unchangedCount > 0
        ? `${payingLess.length} pay less · ${unchangedCount} unchanged`
        : payingLess.length > 0
          ? `All ${payingLess.length} pay less`
          : 'All bills unchanged';
  } else {
    const maxDollar = Math.max(...payingMore.map((c) => c.billDollarChange));
    const maxDollarCustomers = payingMore.filter(
      (c) => Math.abs(c.billDollarChange - maxDollar) <= TIE_TOLERANCE_DOLLARS,
    );

    const maxPct = Math.max(...payingMore.map((c) => c.billPercentChange));
    const maxPctCustomers = payingMore.filter(
      (c) => Math.abs(c.billPercentChange - maxPct) <= 1e-4,
    );

    const dollarNames = formatNameList(
      maxDollarCustomers.map((c) => c.customer.name),
    );
    const pctNames = formatNameList(maxPctCustomers.map((c) => c.customer.name));

    const sameLeaders =
      maxDollarCustomers.length === maxPctCustomers.length &&
      maxDollarCustomers.every((c, i) => c.customer.id === maxPctCustomers[i].customer.id);

    const countSummary = `${payingMore.length} of ${selected.customers.length} customers would pay more than their original subscription bill` +
      (payingLess.length > 0
        ? ` (while ${payingLess.length} would pay less${unchangedCount > 0 ? ` and ${unchangedCount} stay flat` : ''})`
        : unchangedCount > 0
          ? ` (${unchangedCount} unchanged)`
          : '');

    if (sameLeaders) {
      billImpactParagraph = `Under ${selected.label}, ${countSummary}. ${dollarNames} bears both the largest dollar increase (${formatSignedCurrency(maxDollar)}/mo) and the largest percentage increase (${formatPercentChange(maxPct)}).`;
    } else {
      billImpactParagraph = `Under ${selected.label}, ${countSummary}. The largest dollar increase falls on ${dollarNames} (${formatSignedCurrency(maxDollar)}/mo, ${formatPercentChange(maxDollarCustomers[0].billPercentChange)}), while the largest percentage increase falls on ${pctNames} (${formatPercentChange(maxPct)}, ${formatSignedCurrency(maxPctCustomers[0].billDollarChange)}/mo).`;
    }

    payingMoreSublabel = `Max ${formatSignedCurrency(maxDollar)}/mo · up to ${formatPercentChange(maxPct)}`;
  }

  let unprofitableParagraph: string;
  let unprofitableSublabel: string;

  if (selected.unprofitableCount === 0) {
    unprofitableParagraph = `No customers remain unprofitable under ${selected.label} at the current pricing and cost assumptions — every account generates non-negative gross profit.`;
    unprofitableSublabel = 'All accounts profitable';
  } else {
    const sortedUnprofitable = [...selected.unprofitableCustomers].sort(
      (a, b) => a.grossProfit - b.grossProfit,
    );
    const combinedLoss = sortedUnprofitable.reduce(
      (sum, c) => sum + c.grossProfit,
      0,
    );
    const details = sortedUnprofitable.map(
      (c) => `${c.customer.name} (${formatCurrency(c.grossProfit)}/mo)`,
    );
    unprofitableParagraph = `${selected.unprofitableCount} ${selected.unprofitableCount === 1 ? 'customer remains' : 'customers remain'} unprofitable under ${selected.label}, generating ${formatCurrency(combinedLoss)} in combined monthly gross loss: ${formatNameList(details)}.`;
    unprofitableSublabel = `${formatCurrency(combinedLoss)}/mo combined loss`;
  }

  const steepIncreaseReview = calculateSteepBillIncreaseReview(selected);
  const gpDeltaVsOriginal =
    selected.totalGrossProfit - ORIGINAL_BUSINESS.summary.totalGrossProfit;

  const kpis: FinanceTakeawayKpi[] = [
    {
      id: 'gross-profit',
      label: 'Monthly gross profit',
      value: formatCurrency(selected.totalGrossProfit),
      sublabel: `${formatMargin(selected.grossMargin)} margin · ${formatSignedCurrency(gpDeltaVsOriginal)} vs original`,
      tone: selected.totalGrossProfit < -EPSILON ? 'warning' : 'default',
    },
    {
      id: 'paying-more',
      label: 'Customers paying more',
      value: `${payingMore.length} of ${selected.customers.length}`,
      sublabel: payingMoreSublabel,
      tone: 'default',
    },
    {
      id: 'unprofitable',
      label: 'Unprofitable accounts',
      value: `${selected.unprofitableCount} of ${selected.customers.length}`,
      sublabel: unprofitableSublabel,
      tone: selected.unprofitableCount > 0 ? 'warning' : 'default',
    },
    {
      id: 'steep-increase-review',
      label: '50%+ increase review',
      value: `${steepIncreaseReview ? steepIncreaseReview.affectedCount : 0} of ${selected.customers.length}`,
      sublabel: steepIncreaseReview
        ? `${formatPercentShare(steepIncreaseReview.originalRevenueShare)} of original revenue`
        : 'None flagged at 50%+ threshold',
      tone: steepIncreaseReview !== null ? 'warning' : 'default',
    },
  ];

  const validationParagraph = `These results compare the entered prices with customer count and request volume held constant — they do not prove that any single pricing structure is inherently superior. The model cannot determine customer willingness to pay, whether heavy users facing steep increases would churn or negotiate custom commits, or whether metered overages would cause customers to throttle adoption. Before recommending a pricing change, finance and go-to-market teams would need to validate price elasticity, renewal sensitivity on top-tier accounts, and realistic usage responses.`;

  return {
    selectedStructureLabel: selected.label,
    headline,
    kpis,
    profitLeaderParagraph,
    billImpactParagraph,
    steepIncreaseReview,
    unprofitableParagraph,
    validationParagraph,
  };
}
