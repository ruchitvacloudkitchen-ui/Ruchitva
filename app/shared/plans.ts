export type PlanId = 'breakfast' | 'breakfast_lunch';

export interface Plan {
  id: PlanId;
  priceInr: number;
  /** Weekday meal slots in one paid month. */
  days: number;
  hasLunch: boolean;
  name: { te: string; en: string };
  blurb: { te: string; en: string };
}

export const PLANS: Record<PlanId, Plan> = {
  breakfast: {
    id: 'breakfast',
    priceInr: 2800,
    days: 22,
    hasLunch: false,
    name: { te: 'టిఫిన్ ప్లాన్', en: 'Breakfast plan' },
    blurb: {
      te: '22 పనిదినాల చిరుధాన్యాల టిఫిన్, ప్రతి ఉదయం ఇంటికి డెలివరీ',
      en: '22 weekday millet breakfasts, delivered every morning',
    },
  },
  breakfast_lunch: {
    id: 'breakfast_lunch',
    priceInr: 4800,
    days: 22,
    hasLunch: true,
    name: { te: 'టిఫిన్ + భోజనం ప్లాన్', en: 'Breakfast + lunch plan' },
    blurb: {
      te: '22 పనిదినాల టిఫిన్ మరియు భోజనం, రెండూ ఇంటికే',
      en: '22 weekday breakfasts and lunches, both delivered',
    },
  },
};

export const PLAN_IDS: PlanId[] = ['breakfast', 'breakfast_lunch'];

export function isPlanId(value: unknown): value is PlanId {
  return value === 'breakfast' || value === 'breakfast_lunch';
}
