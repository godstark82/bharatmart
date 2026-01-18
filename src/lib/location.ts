export type StoredLocation = {
  // Full address (Amazon-style)
  houseNo?: string; // house/flat/shop number
  floorNo?: string;
  blockNo?: string;
  buildingName?: string;
  area?: string; // street / locality / sector / village
  landmark?: string;
  country?: string;
  deliveryInstructions?: string;
  isDefaultAddress?: boolean;

  pincode?: string;
  city?: string;
  state?: string;
  lat?: number;
  lng?: number;
  source?: "manual" | "gps";
  updatedAt?: number; // epoch ms
};

const STORAGE_KEY = "bharatmart:location";
const AUTO_PROMPTED_KEY = "bharatmart:location:autoPrompted";

export function loadLocation(): StoredLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredLocation;
    const hasAny =
      !!parsed?.pincode ||
      !!parsed?.houseNo ||
      !!parsed?.area ||
      (typeof parsed?.lat === "number" && typeof parsed?.lng === "number");
    if (!hasAny) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveLocation(loc: StoredLocation) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
}

export function clearLocation() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function getLocationLabel(loc: StoredLocation | null) {
  if (!loc) return "Set location";
  if (loc.area && loc.pincode) return `${loc.area} ${loc.pincode}`;
  if (loc.city && loc.pincode) return `${loc.city} ${loc.pincode}`;
  if (loc.pincode) return `${loc.pincode}`;
  if (loc.area) return `${loc.area}`;
  if (loc.city) return `${loc.city}`;
  if (typeof loc.lat === "number" && typeof loc.lng === "number") return "Current location";
  return "Set location";
}

export function formatFullAddress(loc: StoredLocation | null) {
  if (!loc) return "—";
  const line1 = [
    loc.houseNo,
    loc.floorNo ? `Floor ${loc.floorNo}` : null,
    loc.blockNo ? `Block ${loc.blockNo}` : null,
    loc.buildingName,
  ]
    .filter(Boolean)
    .join(", ");

  const line2 = [loc.area, loc.landmark ? `Landmark: ${loc.landmark}` : null]
    .filter(Boolean)
    .join(", ");

  const line3 = [
    [loc.city, loc.state].filter(Boolean).join(", "),
    loc.pincode ? `(${loc.pincode})` : null,
    loc.country,
  ]
    .filter(Boolean)
    .join(" ");

  return [line1, line2, line3].filter((s) => !!s && String(s).trim().length > 0).join("\n");
}

export function wasAutoPrompted() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(AUTO_PROMPTED_KEY) === "1";
}

export function markAutoPrompted() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTO_PROMPTED_KEY, "1");
}

export async function getBrowserCoords(): Promise<{ lat: number; lng: number }> {
  if (typeof window === "undefined") throw new Error("Not in browser");
  if (!("geolocation" in navigator)) throw new Error("Geolocation not supported");

  return await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  });
}

export async function reverseGeocodeToPincode(lat: number, lng: number): Promise<{
  pincode?: string;
  city?: string;
  state?: string;
}> {
  // Best-effort reverse geocoding using OpenStreetMap Nominatim.
  // If it fails, callers should fall back to manual entry.
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
    lat
  )}&lon=${encodeURIComponent(lng)}&addressdetails=1`;
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Reverse geocoding failed");
  const json = (await res.json()) as any;
  const addr = json?.address || {};
  return {
    pincode: addr.postcode,
    city: addr.city || addr.town || addr.village || addr.suburb,
    state: addr.state,
  };
}

export async function detectAndSaveLocation(): Promise<StoredLocation> {
  const { lat, lng } = await getBrowserCoords();
  let decoded: { pincode?: string; city?: string; state?: string } = {};
  try {
    decoded = await reverseGeocodeToPincode(lat, lng);
  } catch {
    // ignore; allow manual entry
  }
  const loc: StoredLocation = {
    ...decoded,
    lat,
    lng,
    source: "gps",
    updatedAt: Date.now(),
  };
  saveLocation(loc);
  return loc;
}

