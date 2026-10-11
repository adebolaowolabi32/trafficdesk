# Simulation architecture

`src/network.ts` defines route topology, stop coordinates, fares, capacity and polyline geometry. `src/simulation.ts` owns the deterministic state transitions. `src/Map.tsx` projects that state onto an interactive SVG, and `src/main.tsx` renders controls, inspectors, tickets and analytics.

## Time and state

The browser advances the reducer every 100ms by 0.1 × selected speed seconds. Each tick is subdivided into steps no longer than 0.25 seconds. Timers pause in hidden tabs, preserving simulation time during background throttling. The simulation resumes from its paused time and resets on reload. The reset action restores seed 42 and the starting network.

Queues are counts keyed by stop and route. Buses hold destination-keyed counts. Service unloads arriving passengers, boards as many queued passengers as seats permit, assigns destinations, charges simulated fares, and dwells for two simulation seconds. Generated passengers travel two stops. The optional rider ticket tracks its queue position and selected destination, consuming a seat in the same passenger accounting system.

The central invariant is:

```
created passengers = waiting passengers + onboard passengers + completed journeys
```

The simulation tests check this through incident and demand changes. Ticket status follows waiting → onboard → arrived; each rider has one active ticket at a time.

## Incidents and dispatch

A closure affects new departures on the University–Freedom Park leg; vehicles already on a leg retain its geometry until arrival. A detour changes departure geometry and therefore travel time. A broken vehicle keeps its position and loads until repaired. Reserves appear immediately at the requested served stop. Automatic dispatch has a per-route interval and shares the global 18-vehicle limit.

## Repeatable experiment

City pulse runs two isolated states with the same initial seed and rush-hour demand for 120 simulation seconds. The intervention adds one reserve bus for each route at Marina at time zero. It reports final waiting passengers and completed journeys. These comparisons measure the intervention's effect within the seeded simulation.

## Rendering and access

SVG route polylines and bus positions use the same segment geometry. Map controls support keyboard activation; the SVG supports drag/pan and bounded zoom. Queue badges display exact counts, with up to twelve passenger figures per stop. Up to five boarding and alighting figures visualize each service event for two seconds. Reduced motion disables transitions and starts the simulation paused. Dialogs use native modal focus handling and Escape dismissal. All fonts are bundled locally.

## Boundaries

The model intentionally omits intersections, congestion, transfers, walking networks, telemetry ingestion, server-side orchestration and durable storage. Its architecture supports a testable browser simulation.
