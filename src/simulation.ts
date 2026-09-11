import {
  capacity,
  maxFleet,
  routeById,
  routes,
  stopById,
  segment,
  along,
  length,
  velocity,
  type Point,
} from "./network";
export type Bus = {
  id: string;
  routeId: string;
  stopIndex: number;
  leg: Point[] | null;
  traveled: number;
  dwell: number;
  loads: Record<string, number>;
  broken: boolean;
  blocked: boolean;
  detouring: boolean;
  trips: number;
  boardedNow: number;
  alightedNow: number;
  servicedAt: number;
};
export type Ticket = {
  id: number;
  routeId: string;
  from: string;
  to: string;
  ahead: number;
  status: "waiting" | "onboard" | "arrived";
  busId: string | null;
  issued: number;
};
export type State = {
  time: number;
  seed: number;
  buses: Bus[];
  queues: Record<string, Record<string, number>>;
  completed: number;
  boarded: number;
  revenue: number;
  created: number;
  nextBus: number;
  rush: boolean;
  closure: boolean;
  detour: boolean;
  headways: Record<string, number>;
  lastDispatch: Record<string, number>;
  arrivalsAt: number;
  ticket: Ticket | null;
  events: {
    id: number;
    time: number;
    text: string;
    kind: "info" | "good" | "warning";
  }[];
  serial: number;
  challenge: { active: boolean; start: number; cleared: boolean };
  history: { time: number; waiting: number; onboard: number }[];
  historyAt: number;
};
export type Action =
  | { type: "tick"; dt: number }
  | { type: "dispatch"; routeId: string; stopId?: string }
  | { type: "rush" }
  | { type: "closure" }
  | { type: "detour" }
  | { type: "breakdown"; busId: string }
  | { type: "repair"; busId: string }
  | { type: "headway"; routeId: string; value: number }
  | { type: "ticket"; routeId: string; from: string; to: string }
  | { type: "reset" };
export const onboard = (bus: Bus) =>
  Object.values(bus.loads).reduce((a, b) => a + b, 0);
export const waiting = (s: State) =>
  Object.values(s.queues).reduce(
    (a, q) => a + Object.values(q).reduce((a, b) => a + b, 0),
    0,
  );
export const stopQueue = (s: State, stopId: string) =>
  Object.values(s.queues[stopId] || {}).reduce((a, b) => a + b, 0);
export function busPosition(bus: Bus) {
  return bus.leg
    ? along(bus.leg, bus.traveled)
    : { ...stopById[routeById[bus.routeId].stops[bus.stopIndex]], angle: 0 };
}
function random(s: State) {
  s.seed = (Math.imul(s.seed, 1664525) + 1013904223) >>> 0;
  return s.seed / 4294967296;
}
function log(
  s: State,
  text: string,
  kind: State["events"][number]["kind"] = "info",
) {
  s.events.unshift({ id: ++s.serial, time: s.time, text, kind });
  s.events = s.events.slice(0, 30);
}
function service(s: State, b: Bus) {
  const r = routeById[b.routeId],
    stopId = r.stops[b.stopIndex];
  const off = b.loads[stopId] || 0;
  s.completed += off;
  delete b.loads[stopId];
  if (
    s.ticket?.busId === b.id &&
    s.ticket.to === stopId &&
    s.ticket.status === "onboard"
  ) {
    s.ticket.status = "arrived";
    log(
      s,
      `You arrived at ${stopById[stopId].name}. Thanks for riding!`,
      "good",
    );
  }
  const q = s.queues[stopId][r.id],
    count = Math.min(q, capacity - onboard(b));
  let ticketBoards = false;
  if (
    s.ticket?.status === "waiting" &&
    s.ticket.from === stopId &&
    s.ticket.routeId === r.id
  ) {
    if (s.ticket.ahead < count) {
      ticketBoards = true;
      s.ticket.status = "onboard";
      s.ticket.busId = b.id;
      log(
        s,
        `Your ticket was scanned on ${b.id}. Next: ${stopById[s.ticket.to].name}.`,
        "good",
      );
    } else s.ticket.ahead -= count;
  }
  const dest = r.stops[(b.stopIndex + 2) % r.stops.length];
  b.loads[dest] = (b.loads[dest] || 0) + count - (ticketBoards ? 1 : 0);
  if (ticketBoards && s.ticket)
    b.loads[s.ticket.to] = (b.loads[s.ticket.to] || 0) + 1;
  s.queues[stopId][r.id] -= count;
  s.boarded += count;
  s.revenue += count * r.fare;
  b.boardedNow = count;
  b.alightedNow = off;
  b.servicedAt = s.time;
  b.dwell = 2;
  if (count >= 12)
    log(s, `${b.id} picked up ${count} at ${stopById[stopId].name}.`, "good");
}
function dispatch(s: State, routeId: string, stopId?: string) {
  if (s.buses.length >= maxFleet || !routeById[routeId]) return;
  const r = routeById[routeId];
  const index =
    stopId && r.stops.includes(stopId) ? r.stops.indexOf(stopId) : 0;
  const b: Bus = {
    id: `TD-${String(s.nextBus++).padStart(3, "0")}`,
    routeId,
    stopIndex: index,
    leg: null,
    traveled: 0,
    dwell: 2,
    loads: {},
    broken: false,
    blocked: false,
    detouring: false,
    trips: 0,
    boardedNow: 0,
    alightedNow: 0,
    servicedAt: -10,
  };
  s.buses.push(b);
  s.lastDispatch[routeId] = s.time;
  log(s, `${b.id} dispatched to ${stopById[r.stops[index]].name}.`, "good");
  service(s, b);
}
export function initialState(): State {
  const s: State = {
    time: 0,
    seed: 42,
    buses: [],
    queues: {},
    completed: 0,
    boarded: 0,
    revenue: 0,
    created: 0,
    nextBus: 101,
    rush: false,
    closure: false,
    detour: false,
    headways: { mainland: 0, island: 0, coastal: 0 },
    lastDispatch: { mainland: 0, island: 0, coastal: 0 },
    arrivalsAt: 6,
    ticket: null,
    events: [],
    serial: 0,
    challenge: { active: false, start: 0, cleared: false },
    history: [],
    historyAt: 0,
  };
  for (const r of routes)
    for (const [i, id] of r.stops.entries()) {
      (s.queues[id] ||= {})[r.id] = id === "cms" ? 18 : 3 + (i % 3) * 3;
    }
  s.created = waiting(s);
  for (const r of routes) {
    dispatch(s, r.id, r.stops[1]);
    dispatch(s, r.id, r.stops[4]);
  }
  // Stagger vehicles along their outgoing leg so the opening map is already alive.
  s.buses.forEach((b, i) => {
    b.leg = segment(b.routeId, b.stopIndex);
    b.traveled = length(b.leg) * (i % 2 ? 0.55 : 0.25);
    b.dwell = 0;
  });
  s.events = [];
  log(s, "Morning service is running. Your city is ready.");
  s.history = [
    {
      time: 0,
      waiting: waiting(s),
      onboard: s.buses.reduce((n, b) => n + onboard(b), 0),
    },
  ];
  return s;
}
function tick(s: State, dt: number) {
  s.time += dt;
  if (s.time >= s.arrivalsAt) {
    s.arrivalsAt += 6;
    for (const r of routes)
      for (const id of r.stops) {
        const n = Math.floor(random(s) * (s.rush ? 5 : 3));
        s.queues[id][r.id] += n;
        s.created += n;
      }
  }
  for (const r of routes)
    if (
      s.headways[r.id] > 0 &&
      s.time - s.lastDispatch[r.id] >= s.headways[r.id]
    )
      dispatch(s, r.id);
  for (const b of s.buses) {
    if (b.broken) continue;
    if (b.leg) {
      b.traveled += velocity * dt;
      if (b.traveled >= length(b.leg)) {
        b.stopIndex = (b.stopIndex + 1) % routeById[b.routeId].stops.length;
        b.leg = null;
        b.traveled = 0;
        b.detouring = false;
        b.trips++;
        service(s, b);
      }
    } else {
      b.dwell = Math.max(0, b.dwell - dt);
      if (b.dwell <= 0) {
        if (
          b.routeId === "mainland" &&
          b.stopIndex === 1 &&
          s.closure &&
          !s.detour
        ) {
          b.blocked = true;
          continue;
        }
        b.blocked = false;
        b.detouring =
          b.routeId === "mainland" &&
          b.stopIndex === 1 &&
          s.closure &&
          s.detour;
        b.leg = segment(b.routeId, b.stopIndex, b.detouring);
        b.traveled = 0;
      }
    }
  }
  if (s.challenge.active && !s.challenge.cleared && stopQueue(s, "cms") < 20) {
    s.challenge.cleared = true;
    log(
      s,
      "Marina challenge complete! Fewer than 20 passengers are waiting.",
      "good",
    );
  }
  if (s.time >= s.historyAt + 5) {
    s.historyAt = s.time;
    s.history.push({
      time: s.time,
      waiting: waiting(s),
      onboard: s.buses.reduce((n, b) => n + onboard(b), 0),
    });
    s.history = s.history.slice(-36);
  }
}
export function reduce(state: State, action: Action): State {
  if (action.type === "reset") return initialState();
  const s = structuredClone(state);
  switch (action.type) {
    case "tick": {
      let remaining = Math.max(0, Math.min(10, action.dt));
      while (remaining > 1e-8) {
        const dt = Math.min(0.25, remaining);
        tick(s, dt);
        remaining -= dt;
      }
      break;
    }
    case "dispatch":
      dispatch(s, action.routeId, action.stopId);
      break;
    case "headway":
      if (routeById[action.routeId] && [0, 20, 40, 60].includes(action.value)) {
        s.headways[action.routeId] = action.value;
        s.lastDispatch[action.routeId] = s.time;
        log(
          s,
          `${routeById[action.routeId].name}: ${action.value ? `dispatch every ${action.value} seconds` : "manual dispatch"}.`,
        );
      }
      break;
    case "rush":
      s.rush = !s.rush;
      if (s.rush) {
        for (const r of routes) {
          s.queues.cms[r.id] += 18;
          s.created += 18;
        }
        s.challenge = { active: true, start: s.time, cleared: false };
        log(s, "Rush hour at Marina. Get the queue below 20.", "warning");
      } else log(s, "Demand has returned to normal.");
      break;
    case "closure":
      s.closure = !s.closure;
      s.detour = false;
      log(
        s,
        s.closure
          ? "Lagoon bridge closed. Mainland buses will hold at University."
          : "Lagoon bridge reopened. Normal service resumes.",
        s.closure ? "warning" : "good",
      );
      break;
    case "detour":
      if (s.closure) {
        s.detour = !s.detour;
        log(
          s,
          s.detour
            ? "Mainland buses rerouted via the eastern bridge."
            : "Detour removed. Buses will hold at University.",
          s.detour ? "good" : "warning",
        );
      }
      break;
    case "breakdown": {
      const b = s.buses.find((b) => b.id === action.busId);
      if (b && !b.broken) {
        b.broken = true;
        log(
          s,
          `${b.id} has broken down. ${onboard(b)} passengers need service restored.`,
          "warning",
        );
      }
      break;
    }
    case "repair": {
      const b = s.buses.find((b) => b.id === action.busId);
      if (b?.broken) {
        b.broken = false;
        log(s, `${b.id} repaired and back in service.`, "good");
      }
      break;
    }
    case "ticket": {
      const r = routeById[action.routeId];
      if (
        !r ||
        !r.stops.includes(action.from) ||
        !r.stops.includes(action.to) ||
        action.from === action.to ||
        (s.ticket && s.ticket.status !== "arrived")
      )
        break;
      const ahead = s.queues[action.from][r.id];
      s.queues[action.from][r.id]++;
      s.created++;
      s.ticket = {
        id: ++s.serial,
        routeId: r.id,
        from: action.from,
        to: action.to,
        ahead,
        status: "waiting",
        busId: null,
        issued: s.time,
      };
      log(
        s,
        `Demo ticket issued: ${stopById[action.from].name} → ${stopById[action.to].name}.`,
      );
      break;
    }
  }
  return s;
}
export function eta(s: State, routeId: string, stopId: string): number | null {
  const r = routeById[routeId];
  if (!r || !r.stops.includes(stopId)) return null;
  const values = s.buses
    .filter((b) => b.routeId === routeId && !b.broken)
    .map((b) => {
      let index = b.stopIndex,
        time = 0;
      if (!b.leg && r.stops[index] === stopId) return 0;
      if (b.leg) {
        time += (length(b.leg) - b.traveled) / velocity;
        index = (index + 1) % r.stops.length;
      } else time += b.dwell;
      for (let count = 0; count < r.stops.length; count++) {
        if (r.stops[index] === stopId) return time;
        if (routeId === "mainland" && index === 1 && s.closure && !s.detour)
          return Infinity;
        time +=
          2 +
          length(
            segment(
              routeId,
              index,
              routeId === "mainland" && index === 1 && s.closure && s.detour,
            ),
          ) /
            velocity;
        index = (index + 1) % r.stops.length;
      }
      return Infinity;
    });
  const value = Math.min(...values);
  return Number.isFinite(value) ? Math.ceil(value) : null;
}
export function clock(seconds: number) {
  const total = 8 * 3600 + 12 * 60 + Math.floor(seconds);
  return `${String(Math.floor(total / 3600) % 24).padStart(2, "0")}:${String(Math.floor(total / 60) % 60).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function compareRushHour() {
  let baseline = reduce(initialState(), { type: "rush" }),
    intervention = structuredClone(baseline);
  for (const routeId of ["mainland", "island", "coastal"])
    intervention = reduce(intervention, {
      type: "dispatch",
      routeId,
      stopId: "cms",
    });
  for (let i = 0; i < 480; i++) {
    baseline = reduce(baseline, { type: "tick", dt: 0.25 });
    intervention = reduce(intervention, { type: "tick", dt: 0.25 });
  }
  return [baseline, intervention].map((s) => ({
    waiting: waiting(s),
    completed: s.completed,
    fleet: s.buses.length,
    created: s.created,
  }));
}
