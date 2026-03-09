export function getCouriersForZone(zone: "NIGERIA" | "AFRICA" | "INTERNATIONAL") {
  if (zone === "NIGERIA")       return ["GIG Logistics", "Sendbox", "Kwik Delivery", "DHL Nigeria"];
  if (zone === "AFRICA")        return ["DHL Express", "Aramex Africa", "Sendbox"];
  if (zone === "INTERNATIONAL") return ["DHL", "FedEx", "UPS", "Aramex"];
  return [];
}

export function getEtaForZone(zone: "NIGERIA" | "AFRICA" | "INTERNATIONAL", courier: string) {
  if (zone === "NIGERIA") {
    if (courier === "Kwik Delivery") return { label: "Same Day / Next Day", days: 1 };
    if (courier === "GIG Logistics") return { label: "1–2 business days",  days: 2 };
    return { label: "2–3 business days", days: 3 };
  }
  if (zone === "AFRICA")        return { label: "3–7 business days",  days: 7 };
  if (zone === "INTERNATIONAL") return { label: "7–14 business days", days: 14 };
  return { label: "TBD", days: 0 };
}
