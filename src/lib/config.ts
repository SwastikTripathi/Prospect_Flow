
import type { AvailablePlan, SubscriptionTier, PlanFeature } from '@/lib/types';

export type PlanLimits = {
  companies: number;
  contacts: number;
  jobOpenings: number;
};

export const PLAN_LIMITS: Record<SubscriptionTier, PlanLimits> = {
  'free': {
    companies: 30,
    contacts: 30,
    jobOpenings: 30,
  },
  'premium': {
    companies: 100,
    contacts: 100,
    jobOpenings: 100,
  },
};

export function getLimitsForTier(tier: SubscriptionTier, isPrivileged: boolean = false): PlanLimits {
  if (isPrivileged) {
    return {
      companies: Infinity,
      contacts: Infinity,
      jobOpenings: Infinity,
    };
  }
  return PLAN_LIMITS[tier] || PLAN_LIMITS.free;
}

const commonFeatures: PlanFeature[] = [
  { text: 'Automated follow-up reminders', included: true },
  { text: 'Centralized dashboard overview', included: true },
  { text: 'Full access to our insightful blogs', included: true },
  { text: 'Integrated contact and company management', included: true },
  { text: 'Save your favorite mail templates', included: true },
];

const freeFeatures: PlanFeature[] = [
  { text: `Track up to ${PLAN_LIMITS.free.jobOpenings} job openings`, included: true },
  { text: `Manage up to ${PLAN_LIMITS.free.contacts} contacts`, included: true },
  { text: `Store up to ${PLAN_LIMITS.free.companies} companies`, included: true },
  ...commonFeatures
];

const premiumFeatures: PlanFeature[] = [
  { text: `Track up to ${PLAN_LIMITS.premium.jobOpenings} job openings`, included: true },
  { text: `Manage up to ${PLAN_LIMITS.premium.contacts} contacts`, included: true },
  { text: `Store up to ${PLAN_LIMITS.premium.companies} companies`, included: true },
  ...commonFeatures
];

export const ALL_AVAILABLE_PLANS: AvailablePlan[] = [
  {
    id: 'free',
    databaseTier: 'free',
    name: 'Free Tier',
    displayNameLines: ["Free Tier", "Forever!"],
    priceMonthly: 0,
    durationMonths: 12 * 99,
    description: 'No credit card, no catch — just pure job-hunting awesomeness.',
    features: freeFeatures,
    isPopular: false,
    publicCtaText: "Get started for Free",
  },
  {
    id: 'premium-1m',
    databaseTier: 'premium',
    name: 'Premium - 1 Month',
    displayNameLines: ["Premium", "1 Month"],
    priceMonthly: 59,
    durationMonths: 1,
    description: 'Test the waters freely with full access and total flexibility.',
    features: premiumFeatures,
    isPopular: false,
    publicCtaText: "Where premium meets affordable",
  },
  {
    id: 'premium-6m',
    databaseTier: 'premium',
    name: 'Premium - 6 Months',
    displayNameLines: ["Premium", "6 Months"],
    priceMonthly: 58,
    durationMonths: 6,
    discountPercentage: 15,
    description: 'Perfect if you’re seriously in it for the long job-hunt haul.',
    features: premiumFeatures,
    isPopular: true,
    publicCtaText: "Lock in the savings!",
  },
  {
    id: 'premium-12m',
    databaseTier: 'premium',
    name: 'Premium - 12 Months',
    displayNameLines: ["Premium", "12 Months"],
    priceMonthly: 59,
    durationMonths: 12,
    discountPercentage: 25,
    description: 'One-time easy commit. One year of focused job-win progress.',
    features: premiumFeatures,
    isPopular: false,
    publicCtaText: "Your wallet will thank you!",
  },
];

export const OWNER_EMAIL = 'swastiktripathi.space@gmail.com';


    