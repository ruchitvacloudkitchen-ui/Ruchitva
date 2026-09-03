import type { PlanId } from '../../shared/plans';
import type { Status } from '../../shared/subscription';

export interface SubscriberRow {
  id: string;
  name: string;
  phone: string;
  address: string;
  landmark: string | null;
  building: string | null;
  plan: PlanId;
  price_inr: number;
  start_date: string;
  days_total: number;
  cycles: number;
  status: Status;
  upi_ref: string | null;
  paid_at: string | null;
  paused_on: string | null;
  source: 'web' | 'manual';
  notes: string | null;
  created_at: string;
}

export interface SkipRow {
  subscriber_id: string;
  skip_date: string;
}

export interface DeliveryRow {
  subscriber_id: string;
  delivery_date: string;
  delivered: boolean;
}

export interface MenuRow {
  day_of_week: number;
  meal: 'breakfast' | 'lunch';
  item_te: string;
  item_en: string;
  sort_order: number;
}
