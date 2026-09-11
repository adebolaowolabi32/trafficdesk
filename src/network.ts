export type Point = { x: number; y: number };
export type Stop = Point & { id: string; name: string; area: string };
export const stops: Stop[] = [
  { id: "yaba", name: "Yaba", area: "MAINLAND", x: 235, y: 180 },
  { id: "unilag", name: "University", area: "MAINLAND", x: 390, y: 130 },
  { id: "oyingbo", name: "Oyingbo", area: "MAINLAND", x: 215, y: 340 },
  { id: "idumota", name: "Idumota", area: "LAGOS ISLAND", x: 375, y: 425 },
  { id: "cms", name: "Marina Central", area: "LAGOS ISLAND", x: 515, y: 485 },
  { id: "obalende", name: "Obalende", area: "LAGOS ISLAND", x: 595, y: 380 },
  { id: "ikoyi", name: "Ikoyi Gardens", area: "IKOYI", x: 725, y: 310 },
  { id: "falomo", name: "Falomo", area: "IKOYI", x: 835, y: 400 },
  {
    id: "vi",
    name: "Victoria Island",
    area: "VICTORIA ISLAND",
    x: 740,
    y: 560,
  },
  { id: "eko", name: "Eko Atlantic", area: "COAST", x: 620, y: 630 },
  { id: "lekki", name: "Lekki Gate", area: "LEKKI", x: 985, y: 545 },
  { id: "freedom", name: "Freedom Park", area: "LAGOS ISLAND", x: 435, y: 355 },
];
export const stopById = Object.fromEntries(stops.map((s) => [s.id, s]));
export type Route = {
  id: string;
  code: string;
  name: string;
  color: string;
  soft: string;
  stops: string[];
  fare: number;
  description: string;
};
export const routes: Route[] = [
  {
    id: "mainland",
    code: "01",
    name: "Mainland Loop",
    color: "#338d77",
    soft: "#e6f1e9",
    stops: ["yaba", "unilag", "freedom", "cms", "idumota", "oyingbo"],
    fare: 400,
    description: "Yaba → Marina → Oyingbo",
  },
  {
    id: "island",
    code: "02",
    name: "Island Connect",
    color: "#e39a42",
    soft: "#fcf0dd",
    stops: ["cms", "obalende", "ikoyi", "falomo", "vi", "eko"],
    fare: 500,
    description: "Marina → Ikoyi → Victoria Island",
  },
  {
    id: "coastal",
    code: "03",
    name: "Coastal Express",
    color: "#6b83bb",
    soft: "#edf0f9",
    stops: ["obalende", "falomo", "lekki", "vi", "cms"],
    fare: 600,
    description: "Obalende → Lekki → Marina",
  },
];
export const routeById = Object.fromEntries(routes.map((r) => [r.id, r]));
export const capacity = 32;
export const maxFleet = 18;
export const velocity = 25;
export function segment(
  routeId: string,
  index: number,
  detour = false,
): Point[] {
  const route = routeById[routeId];
  const a = stopById[route.stops[index]],
    b = stopById[route.stops[(index + 1) % route.stops.length]];
  if (routeId === "mainland" && index === 1)
    return detour
      ? [a, { x: 470, y: 165 }, { x: 540, y: 240 }, { x: 535, y: 325 }, b]
      : [a, { x: 405, y: 230 }, b];
  if (routeId === "mainland" && index === 5)
    return [a, { x: 145, y: 295 }, { x: 145, y: 225 }, b];
  if (routeId === "island" && index === 5) return [a, { x: 500, y: 600 }, b];
  if (routeId === "coastal" && index === 1)
    return [a, { x: 955, y: 420 }, { x: 1020, y: 475 }, b];
  if (routeId === "coastal" && index === 2) return [a, { x: 885, y: 600 }, b];
  return [a, b];
}
export const distance = (a: Point, b: Point) =>
  Math.hypot(b.x - a.x, b.y - a.y);
export const length = (points: Point[]) =>
  points.slice(1).reduce((n, p, i) => n + distance(points[i], p), 0);
export function along(
  points: Point[],
  traveled: number,
): Point & { angle: number } {
  let rest = traveled;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i],
      d = distance(a, b);
    if (rest <= d || i === points.length - 1) {
      const t = Math.max(0, Math.min(1, rest / d));
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
      };
    }
    rest -= d;
  }
  return { ...points[0], angle: 0 };
}
export const path = (points: Point[]) =>
  points.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");
