export interface DeliveryZone {
  id: string;
  name: string;
  feeKes: number;
  eta: string;
}

// Edit these to match your real rider, pickup point and courier prices.
export const DELIVERY_ZONES: DeliveryZone[] = [
  { id: "nairobi-cbd", name: "Nairobi CBD (rider)", feeKes: 150, eta: "Same day" },
  { id: "nairobi-estates", name: "Nairobi estates (rider)", feeKes: 300, eta: "Same or next day" },
  { id: "pickup-point", name: "Pickup point near you (e.g. Pick Up Mtaani)", feeKes: 200, eta: "1 to 2 days" },
  { id: "upcountry", name: "Upcountry courier", feeKes: 450, eta: "1 to 3 days" },
];

export function findZone(id: string): DeliveryZone | undefined {
  return DELIVERY_ZONES.find((z) => z.id === id);
}
