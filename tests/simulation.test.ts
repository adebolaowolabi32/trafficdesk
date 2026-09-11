import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  reduce,
  waiting,
  onboard,
  stopQueue,
  eta,
  busPosition,
  type State,
} from "../src/simulation";
import { capacity, maxFleet } from "../src/network";
function advance(s: State, seconds: number) {
  for (let i = 0; i < seconds * 4; i++)
    s = reduce(s, { type: "tick", dt: 0.25 });
  return s;
}
function conserved(s: State) {
  assert.equal(
    s.created,
    waiting(s) + s.buses.reduce((n, b) => n + onboard(b), 0) + s.completed,
  );
  for (const b of s.buses) {
    assert.ok(onboard(b) <= capacity);
    assert.ok(onboard(b) >= 0);
  }
  for (const q of Object.values(s.queues))
    for (const n of Object.values(q)) assert.ok(Number.isInteger(n) && n >= 0);
}
test("passengers are conserved through demand, boarding, breakdown, repair and detours", () => {
  let s = initialState();
  for (let i = 0; i < 180; i++) {
    if (i === 10) s = reduce(s, { type: "rush" });
    if (i === 20) s = reduce(s, { type: "closure" });
    if (i === 40) s = reduce(s, { type: "detour" });
    if (i === 60) s = reduce(s, { type: "breakdown", busId: s.buses[0].id });
    if (i === 80) s = reduce(s, { type: "repair", busId: s.buses[0].id });
    s = advance(s, 1);
    conserved(s);
  }
  assert.ok(s.completed > 0);
  assert.ok(s.revenue > 0);
});
test("identical seed and commands replay deterministically without mutating input", () => {
  const s = initialState(),
    copy = structuredClone(s);
  assert.deepEqual(advance(s, 30), advance(initialState(), 30));
  assert.deepEqual(s, copy);
});
test("sending reserves to Marina clears the rush challenge", () => {
  let s = reduce(initialState(), { type: "rush" });
  const before = stopQueue(s, "cms");
  for (const routeId of ["mainland", "island", "coastal"])
    s = reduce(s, { type: "dispatch", routeId, stopId: "cms" });
  s = advance(s, 1);
  assert.ok(stopQueue(s, "cms") < before);
  assert.ok(s.challenge.cleared);
  conserved(s);
});
test("bridge closure holds departures until alternate route opens", () => {
  let s = reduce(initialState(), { type: "closure" });
  s = reduce(s, { type: "dispatch", routeId: "mainland", stopId: "unilag" });
  const id = s.buses.at(-1)!.id;
  s = advance(s, 3);
  const b = s.buses.find((b) => b.id === id)!;
  assert.equal(b.blocked, true);
  assert.equal(b.leg, null);
  s = reduce(s, { type: "detour" });
  s = advance(s, 1);
  assert.equal(s.buses.find((b) => b.id === id)!.detouring, true);
});
test("breakdowns freeze vehicles and repair resumes movement", () => {
  let s = initialState();
  const id = s.buses[0].id;
  s = reduce(s, { type: "breakdown", busId: id });
  const p = busPosition(s.buses[0]);
  s = advance(s, 4);
  assert.deepEqual(busPosition(s.buses[0]), p);
  s = reduce(s, { type: "repair", busId: id });
  s = advance(s, 1);
  assert.notDeepEqual(busPosition(s.buses[0]), p);
});
test("a passenger ticket boards once, travels and arrives without creating extra passengers", () => {
  let s = initialState();
  s = reduce(s, { type: "ticket", routeId: "island", from: "cms", to: "vi" });
  assert.equal(s.ticket?.status, "waiting");
  s = reduce(s, { type: "dispatch", routeId: "island", stopId: "cms" });
  assert.equal(s.ticket?.status, "onboard");
  const revenue = s.revenue;
  s = advance(s, 110);
  assert.equal(s.ticket?.status, "arrived");
  assert.ok(s.revenue >= revenue);
  conserved(s);
});
test("full fleet prevents manual and scheduled overdispatch", () => {
  let s = initialState();
  s = reduce(s, { type: "headway", routeId: "island", value: 20 });
  s = advance(s, 300);
  for (let i = 0; i < 25; i++)
    s = reduce(s, { type: "dispatch", routeId: "coastal" });
  assert.equal(s.buses.length, maxFleet);
  conserved(s);
});
test("invalid journeys and duplicate active tickets are ignored", () => {
  let s = initialState();
  assert.deepEqual(
    reduce(s, { type: "ticket", routeId: "island", from: "cms", to: "cms" }),
    s,
  );
  s = reduce(s, { type: "ticket", routeId: "island", from: "cms", to: "vi" });
  assert.deepEqual(
    reduce(s, { type: "ticket", routeId: "island", from: "cms", to: "vi" }),
    s,
  );
  assert.equal(eta(s, "invalid", "cms"), null);
});
test("reset restores the same initial network", () => {
  assert.deepEqual(
    reduce(advance(reduce(initialState(), { type: "rush" }), 30), {
      type: "reset",
    }),
    initialState(),
  );
});
test("dispatch intervention improves completed journeys against identical untreated demand", () => {
  let baseline = reduce(initialState(), { type: "rush" }),
    treated = structuredClone(baseline);
  for (const routeId of ["mainland", "island", "coastal"])
    treated = reduce(treated, { type: "dispatch", routeId, stopId: "cms" });
  baseline = advance(baseline, 60);
  treated = advance(treated, 60);
  assert.ok(treated.completed > baseline.completed);
  assert.ok(waiting(treated) < waiting(baseline));
  assert.equal(treated.created, baseline.created);
});
