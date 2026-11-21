import { todayISO } from "./format";
import type { Promotion, Service } from "./types";

export function promotionIsCurrent(promotion: Promotion, on = todayISO()) {
  return promotion.active && promotion.startsOn <= on && promotion.endsOn >= on;
}

export function promotionApplies(promotion: Promotion, serviceId: string, on = todayISO()) {
  if (!promotionIsCurrent(promotion, on)) return false;
  return promotion.serviceIds.length === 0 || promotion.serviceIds.includes(serviceId);
}

export function applyDiscount(price: number, promotion: Promotion) {
  if (promotion.discountType === "percent") {
    return Math.max(0, Math.round(price * (1 - promotion.discountValue / 100)));
  }
  return Math.max(0, price - promotion.discountValue);
}

export function bestOffer(service: Service, promotions: Promotion[], on = todayISO()) {
  return promotions.reduce<{ price: number; promotion: Promotion | null }>(
    (best, promotion) => {
      if (!promotionApplies(promotion, service.id, on)) return best;
      const price = applyDiscount(service.price, promotion);
      return price < best.price ? { price, promotion } : best;
    },
    { price: service.price, promotion: null },
  );
}

export function bestPrice(service: Service, promotions: Promotion[], on = todayISO()) {
  return bestOffer(service, promotions, on).price;
}
