import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BusFront,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Flag,
  Github,
  MapPin,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Route as RouteIcon,
  Ticket as TicketIcon,
  Users,
  Waves,
  Wrench,
  X,
  Zap,
  TrendingUp,
  MousePointer2,
  CircleParking,
  Navigation,
  GitBranch,
  Volume2,
} from "lucide-react";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/manrope";
import {
  routes,
  routeById,
  stops,
  stopById,
  capacity,
  maxFleet,
} from "./network";
import {
  initialState,
  reduce,
  compareRushHour,
  waiting,
  onboard,
  stopQueue,
  eta,
  clock,
  type Action,
  type State,
} from "./simulation";
import { NetworkMap, type Selection } from "./Map";
import "./styles.css";
const fare = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="modal-title"
    >
      <header>
        <span className="eyebrow">TRAFFICDESK FIELD GUIDE</span>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close guide"
        >
          <X size={20} />
        </button>
      </header>
      <h2 id="modal-title">{title}</h2>
      {children}
    </dialog>
  );
}
function App() {
  const [state, setState] = useState(initialState),
    [paused, setPaused] = useState(
      () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
    [speed, setSpeed] = useState(1),
    [mode, setMode] = useState<"operator" | "passenger">("operator"),
    [selection, setSelection] = useState<Selection>({
      kind: "stop",
      id: "cms",
    }),
    [activeRoute, setActiveRoute] = useState("all"),
    [guide, setGuide] = useState(false),
    [resetOpen, setResetOpen] = useState(false),
    [tab, setTab] = useState<"map" | "insights">("map"),
    [notice, setNotice] = useState(""),
    [rideRoute, setRideRoute] = useState("island"),
    [from, setFrom] = useState("cms"),
    [to, setTo] = useState("vi");
  const pauseRef = useRef(paused);
  pauseRef.current = paused;
  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden && !pauseRef.current)
        setState((s) => reduce(s, { type: "tick", dt: 0.1 * speed }));
    }, 100);
    return () => clearInterval(timer);
  }, [speed]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(timer);
  }, [notice]);
  const act = (action: Action, message?: string) => {
    setState((s) => reduce(s, action));
    if (message) setNotice(message);
  };
  const select = (s: Selection) => {
    setSelection(s);
    if (s.kind === "route") setActiveRoute(s.id);
  };
  const bus =
    selection.kind === "bus"
      ? state.buses.find((b) => b.id === selection.id)
      : undefined;
  const selectedStop =
    selection.kind === "stop" ? stopById[selection.id] : undefined;
  const selectedRoute =
    routeById[
      selection.kind === "route" ? selection.id : bus?.routeId || activeRoute
    ] || routes[0];
  const allOnboard = state.buses.reduce((n, b) => n + onboard(b), 0),
    available = state.buses.filter((b) => !b.broken).length,
    queue = waiting(state),
    ticket = state.ticket;
  const dispatch = (id: string, stopId?: string) => {
    if (state.buses.length >= maxFleet) {
      setNotice(
        "All 18 buses are deployed. Repair a bus or reset to start again.",
      );
      return;
    }
    act(
      { type: "dispatch", routeId: id, stopId },
      "Bus dispatched. Passengers are boarding at the selected stop.",
    );
  };
  const changeRideRoute = (id: string) => {
    setRideRoute(id);
    setFrom(routeById[id].stops[0]);
    setTo(routeById[id].stops[2]);
    setActiveRoute(id);
  };
  return (
    <>
      <a className="skip-link" href="#workspace">
        Skip to simulation
      </a>
      <header className="app-header">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setTab("map");
          }}
        >
          <span className="brand-mark">
            <RouteIcon size={24} />
          </span>
          traffic<span>desk</span>
          <i>BETA</i>
        </a>
        <nav className="mode-switch" aria-label="Workspace mode">
          <button
            className={mode === "operator" ? "active" : ""}
            onClick={() => setMode("operator")}
          >
            <Activity size={15} /> Fleet control
          </button>
          <button
            className={mode === "passenger" ? "active" : ""}
            onClick={() => {
              setMode("passenger");
              setTab("map");
            }}
          >
            <TicketIcon size={15} /> Take a ride
          </button>
        </nav>
        <div className="header-actions">
          <span className="sandbox-label">
            <span /> BROWSER SIMULATION
          </span>
          <button
            className="icon-button"
            onClick={() => setGuide(true)}
            aria-label="How to play"
          >
            <CircleHelp size={20} />
          </button>
          <a
            className="icon-button"
            href="https://github.com/adebolaowolabi32"
            aria-label="View Cynthia on GitHub"
          >
            <Github size={19} />
          </a>
        </div>
      </header>
      <main id="workspace">
        <section className="page-heading">
          <div>
            <div className="eyebrow">
              <span className="sun-icon">✳</span> A LITTLE CITY. A LOT OF
              POSSIBILITIES.
            </div>
            <h1>
              {mode === "operator"
                ? "Keep the city moving."
                : "Your next stop awaits."}
            </h1>
            <p>
              {mode === "operator"
                ? "Dispatch a bus. Change a route. Make someone's morning."
                : "Pick a journey, grab a demo ticket, and follow your bus across the city."}
            </p>
          </div>
          <div className="sim-clock">
            <div>
              <span className="eyebrow">SIMULATION TIME</span>
              <strong data-testid="sim-clock">
                {clock(state.time)}
                <small>AM</small>
              </strong>
            </div>
            <div className="time-controls">
              <button
                aria-label={paused ? "Resume simulation" : "Pause simulation"}
                onClick={() => setPaused((p) => !p)}
              >
                {paused ? <Play size={15} /> : <Pause size={15} />}
              </button>
              <div className="speed-switch" aria-label="Simulation speed">
                {[1, 3, 8].map((n) => (
                  <button
                    key={n}
                    aria-label={`${n} times speed`}
                    aria-pressed={speed === n}
                    className={speed === n ? "active" : ""}
                    onClick={() => setSpeed(n)}
                  >
                    {n}×
                  </button>
                ))}
              </div>
              <button
                aria-label="Reset simulation"
                title="Reset simulation"
                onClick={() => setResetOpen(true)}
              >
                <RotateCcw size={15} />
              </button>
            </div>
          </div>
        </section>
        <section className="metrics" aria-label="Network statistics">
          <Metric
            icon={<BusFront size={19} />}
            title="Buses in service"
            value={`${available}`}
            detail={`/ ${state.buses.length} deployed`}
            color="green"
          />
          <Metric
            icon={<Users size={19} />}
            title="Passengers waiting"
            value={String(queue)}
            detail="across 12 stops"
            color="amber"
          />
          <Metric
            icon={<Navigation size={19} />}
            title="On the move"
            value={String(allOnboard)}
            detail={`${state.completed} arrived`}
            color="blue"
          />
          <Metric
            icon={<TicketIcon size={19} />}
            title="Simulated fare revenue"
            value={fare(state.revenue)}
            detail={`${state.boarded} boardings`}
            color="purple"
          />
        </section>
        <div className="workspace-grid">
          <aside className="network-sidebar">
            {mode === "operator" ? (
              <>
                <div className="section-heading">
                  <h2>Your network</h2>
                  <span className="count-pill">3 routes</span>
                </div>
                <button
                  className={
                    "all-routes " + (activeRoute === "all" ? "active" : "")
                  }
                  onClick={() => setActiveRoute("all")}
                >
                  <RouteIcon size={16} /> Show all routes
                  <Check
                    size={14}
                    className={activeRoute !== "all" ? "invisible" : ""}
                  />
                </button>
                <div className="route-cards">
                  {routes.map((r) => (
                    <article
                      key={r.id}
                      className={
                        "route-card " + (activeRoute === r.id ? "selected" : "")
                      }
                      style={
                        {
                          "--route": r.color,
                          "--route-soft": r.soft,
                        } as React.CSSProperties
                      }
                    >
                      <button
                        className="route-select"
                        aria-label={`Inspect ${r.name}`}
                        onClick={() => select({ kind: "route", id: r.id })}
                      >
                        <span className="route-code">{r.code}</span>
                        <span>
                          <strong>{r.name}</strong>
                          <small>{r.description}</small>
                        </span>
                        <ArrowUpRight size={14} />
                      </button>
                      <div className="route-mini">
                        <span />
                        <i />
                        <i />
                        <i />
                        <i />
                        <span />
                      </div>
                      <div className="route-footer">
                        <span>
                          <BusFront size={13} />
                          {
                            state.buses.filter((b) => b.routeId === r.id).length
                          }{" "}
                          buses <b>·</b> {r.stops.length} stops
                        </span>
                        <button
                          aria-label={`Dispatch ${r.name}`}
                          disabled={state.buses.length >= maxFleet}
                          onClick={() => dispatch(r.id)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
                <p className="fleet-limit">
                  {maxFleet - state.buses.length} buses ready in the depot
                </p>
                <div className="scenario-heading">
                  <span className="eyebrow">SHAKE THINGS UP</span>
                  <Zap size={14} />
                </div>
                <button
                  className={"scenario-button " + (state.rush ? "enabled" : "")}
                  aria-pressed={state.rush}
                  onClick={() => {
                    act({ type: "rush" });
                    select({ kind: "stop", id: "cms" });
                  }}
                >
                  <span className="scenario-icon amber">
                    <Users size={18} />
                  </span>
                  <span>
                    <strong>Rush hour</strong>
                    <small>More people. More possibility.</small>
                  </span>
                  <span className="toggle" />
                </button>
                <button
                  className={
                    "scenario-button " + (state.closure ? "enabled" : "")
                  }
                  aria-pressed={state.closure}
                  onClick={() => act({ type: "closure" })}
                >
                  <span className="scenario-icon rose">
                    <GitBranch size={18} />
                  </span>
                  <span>
                    <strong>Close the bridge</strong>
                    <small>A little detour goes a long way.</small>
                  </span>
                  <span className="toggle" />
                </button>
                {state.closure && (
                  <button
                    className="detour-button"
                    onClick={() => act({ type: "detour" })}
                  >
                    {state.detour ? (
                      <Check size={15} />
                    ) : (
                      <GitBranch size={15} />
                    )}{" "}
                    {state.detour ? "Remove detour" : "Open an alternate route"}
                  </button>
                )}
                <div className="sidebar-note">
                  <Waves size={19} />
                  <p>
                    Inspired by Lagos.
                    <br />
                    <strong>Powered by your decisions.</strong>
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="section-heading">
                  <h2>Where to?</h2>
                  <MapPin size={18} />
                </div>
                <p className="intro-small">
                  A window seat and a new perspective.
                </p>
                <form
                  className="journey-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    act(
                      { type: "ticket", routeId: rideRoute, from, to },
                      "Your demo ticket is ready. Watch for your bus!",
                    );
                    setSelection({ kind: "stop", id: from });
                  }}
                >
                  <label>
                    Choose a line
                    <select
                      value={rideRoute}
                      onChange={(e) => changeRideRoute(e.target.value)}
                    >
                      {routes.map((r) => (
                        <option value={r.id} key={r.id}>
                          {r.code} · {r.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="journey-stops">
                    <label>
                      From
                      <select
                        value={from}
                        onChange={(e) => {
                          setFrom(e.target.value);
                          if (e.target.value === to)
                            setTo(
                              routeById[rideRoute].stops.find(
                                (id) => id !== e.target.value,
                              )!,
                            );
                        }}
                      >
                        {routeById[rideRoute].stops.map((id) => (
                          <option value={id} key={id}>
                            {stopById[id].name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="journey-connector">
                      <span />
                      <span />
                      <span />
                    </div>
                    <label>
                      To
                      <select
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                      >
                        {routeById[rideRoute].stops
                          .filter((id) => id !== from)
                          .map((id) => (
                            <option key={id} value={id}>
                              {stopById[id].name}
                            </option>
                          ))}
                      </select>
                    </label>
                  </div>
                  <div className="fare-row">
                    <span>Single journey</span>
                    <strong>{fare(routeById[rideRoute].fare)}</strong>
                  </div>
                  <button
                    className="primary full"
                    disabled={!!ticket && ticket.status !== "arrived"}
                  >
                    <TicketIcon size={17} />
                    {ticket && ticket.status !== "arrived"
                      ? "Journey in progress"
                      : "Get demo ticket"}
                  </button>
                  <p className="form-note">
                    No payment details. No real charge.
                    <br />
                    Your fare counts when you board.
                  </p>
                </form>
                <div className="rider-hint">
                  <span className="eyebrow">THE CITY IS STILL YOURS</span>
                  <p>
                    Switch to Fleet control to send a bus to your stop. Your
                    ticket travels with you.
                  </p>
                  <button
                    className="text-button"
                    onClick={() => setMode("operator")}
                  >
                    Open fleet control <ArrowRight size={15} />
                  </button>
                </div>
              </>
            )}
          </aside>
          <div className="map-column">
            <div className="map-toolbar">
              <div className="view-tabs">
                <button
                  className={tab === "map" ? "active" : ""}
                  onClick={() => setTab("map")}
                >
                  <MapPin size={14} /> Live map
                </button>
                <button
                  className={tab === "insights" ? "active" : ""}
                  onClick={() => setTab("insights")}
                >
                  <TrendingUp size={14} /> City pulse
                </button>
              </div>
              <span className={"running-state " + (paused ? "is-paused" : "")}>
                <span />
                {paused ? "Simulation paused" : "City in motion"}
              </span>
            </div>
            {tab === "map" ? (
              <NetworkMap
                state={state}
                selection={selection}
                onSelect={select}
                activeRoute={activeRoute}
              />
            ) : (
              <Insights state={state} />
            )}
            <div className="map-bottom">
              <div>
                <MousePointer2 size={16} />
                <span>Select a bus or stop to see its story.</span>
              </div>
              <button onClick={() => setGuide(true)}>
                First time here? <ArrowRight size={14} />
              </button>
            </div>
            <div
              className={
                "challenge-card " + (state.challenge.cleared ? "complete" : "")
              }
            >
              <div className="challenge-icon">
                {state.challenge.cleared ? (
                  <Check size={24} />
                ) : (
                  <Flag size={23} />
                )}
              </div>
              <div>
                <span className="eyebrow">
                  {state.challenge.cleared
                    ? "NICELY DONE, DISPATCHER"
                    : "YOUR FIRST CHALLENGE"}
                </span>
                <h3>
                  {state.challenge.cleared
                    ? "A little less waiting. A lot more moving."
                    : "Give Marina a little breathing room."}
                </h3>
                <p>
                  {state.challenge.active
                    ? `${stopQueue(state, "cms")} passengers waiting. Dispatch buses to Marina and bring the queue below 20.`
                    : "Start rush hour, then dispatch buses to clear the crowd at Marina Central."}
                </p>
              </div>
              <button
                className="challenge-action"
                onClick={() => {
                  if (!state.challenge.active) act({ type: "rush" });
                  setMode("operator");
                  select({ kind: "stop", id: "cms" });
                  setTab("map");
                }}
              >
                {state.challenge.cleared
                  ? "View stop"
                  : state.challenge.active
                    ? "Help Marina"
                    : "Let's try it"}
                <ArrowUpRight size={17} />
              </button>
            </div>
          </div>
          <aside className="inspector" aria-label="Selection details">
            {mode === "passenger" ? (
              <>
                <div className="section-heading">
                  <h2>Your journey</h2>
                  <TicketIcon size={18} />
                </div>
                {ticket ? (
                  <div className="boarding-pass">
                    <div className="ticket-top">
                      <span className="eyebrow">TRAFFICDESK · DEMO PASS</span>
                      <span
                        className="route-code"
                        style={{
                          background: routeById[ticket.routeId].soft,
                          color: routeById[ticket.routeId].color,
                        }}
                      >
                        {routeById[ticket.routeId].code}
                      </span>
                    </div>
                    <h3>{stopById[ticket.from].name}</h3>
                    <ArrowDown size={20} />
                    <h3>{stopById[ticket.to].name}</h3>
                    <div className="ticket-perf" />
                    <div className="ticket-status">
                      <span className="live-dot" />
                      <strong>
                        {ticket.status === "waiting"
                          ? "Waiting to board"
                          : ticket.status === "onboard"
                            ? "You're on your way"
                            : "You've arrived!"}
                      </strong>
                    </div>
                    <p>
                      {ticket.status === "waiting"
                        ? `${ticket.ahead} people ahead of you. Next bus: ${eta(state, ticket.routeId, ticket.from) === null ? "service interrupted" : `${eta(state, ticket.routeId, ticket.from)} simulation seconds`}.`
                        : ticket.status === "onboard"
                          ? `Riding ${ticket.busId}. Follow your bus on the map.`
                          : "Thanks for taking the scenic route. Ready for another journey?"}
                    </p>
                    <div className="ticket-bottom">
                      <span>TD-{String(ticket.id).padStart(5, "0")}</span>
                      <strong>{fare(routeById[ticket.routeId].fare)}</strong>
                    </div>
                    <div className="barcode" aria-hidden="true" />
                    <small>SIMULATION ONLY · NOT VALID FOR TRAVEL</small>
                    {ticket.busId && (
                      <button
                        className="secondary full"
                        onClick={() => {
                          setSelection({ kind: "bus", id: ticket.busId! });
                          setActiveRoute(ticket.routeId);
                          setTab("map");
                          setNotice(
                            `${ticket.busId} is highlighted on the map.`,
                          );
                        }}
                      >
                        Locate my bus <Navigation size={15} />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="empty-ticket">
                    <div>
                      <TicketIcon size={42} />
                    </div>
                    <h3>A little adventure awaits.</h3>
                    <p>
                      Choose your stops and get a demo ticket. You'll join the
                      actual simulated queue.
                    </p>
                  </div>
                )}
                <div className="rider-hint">
                  <span className="eyebrow">A NOTE ON TIMING</span>
                  <p>
                    ETAs use simulation seconds. Full buses may pass you by.
                    Speed up time or dispatch another bus to get moving.
                  </p>
                </div>
              </>
            ) : bus ? (
              <>
                <div className="section-heading">
                  <span className="eyebrow">VEHICLE INSPECTOR</span>
                  <BusFront size={18} />
                </div>
                <div
                  className="bus-illustration"
                  style={
                    { "--route": selectedRoute.color } as React.CSSProperties
                  }
                >
                  <div className="drawn-bus">
                    <div className="bus-windows">
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                    </div>
                    <span>{selectedRoute.code}</span>
                    <div className="bus-wheel left" />
                    <div className="bus-wheel right" />
                  </div>
                </div>
                <div className="inspector-title">
                  <h2>{bus.id}</h2>
                  <span
                    className={
                      "status-chip " +
                      (bus.broken || bus.blocked ? "warning" : "")
                    }
                  >
                    {bus.broken
                      ? "Breakdown"
                      : bus.blocked
                        ? "Bridge hold"
                        : bus.detouring
                          ? "On detour"
                          : bus.leg
                            ? "In transit"
                            : "Boarding"}
                  </span>
                </div>
                <p className="muted">{selectedRoute.name}</p>
                <div className="capacity-heading">
                  <span>Passengers on board</span>
                  <strong>
                    {onboard(bus)} <small>/ {capacity}</small>
                  </strong>
                </div>
                <div
                  className="seat-grid"
                  aria-label={`${onboard(bus)} occupied seats`}
                >
                  {Array.from({ length: capacity }, (_, i) => (
                    <i
                      key={i}
                      className={i < onboard(bus) ? "occupied" : ""}
                      style={
                        {
                          "--route": selectedRoute.color,
                        } as React.CSSProperties
                      }
                    />
                  ))}
                </div>
                <dl className="detail-list">
                  <div>
                    <dt>Next stop</dt>
                    <dd>
                      {
                        stopById[
                          selectedRoute.stops[
                            (bus.stopIndex + 1) % selectedRoute.stops.length
                          ]
                        ].name
                      }
                    </dd>
                  </div>
                  <div>
                    <dt>Stops served</dt>
                    <dd>{bus.trips}</dd>
                  </div>
                  <div>
                    <dt>Single fare</dt>
                    <dd>{fare(selectedRoute.fare)}</dd>
                  </div>
                </dl>
                <button
                  className={bus.broken ? "primary full" : "secondary full"}
                  onClick={() =>
                    act({
                      type: bus.broken ? "repair" : "breakdown",
                      busId: bus.id,
                    })
                  }
                >
                  <Wrench size={16} />
                  {bus.broken ? "Repair & resume" : "Simulate breakdown"}
                </button>
                {bus.blocked && (
                  <button
                    className="primary full spaced"
                    onClick={() => act({ type: "detour" })}
                  >
                    <GitBranch size={15} /> Reroute via eastern bridge
                  </button>
                )}
              </>
            ) : selectedStop ? (
              <>
                <div className="section-heading">
                  <span className="eyebrow">STOP INSPECTOR</span>
                  <MapPin size={18} />
                </div>
                <div className="stop-illustration">
                  <div className="shelter-roof" />
                  <div className="shelter">
                    <span />
                    <span />
                    <span />
                  </div>
                  <i className="person p1" />
                  <i className="person p2" />
                  <i className="person p3" />
                  <div className="shelter-ground" />
                </div>
                <h2 className="stop-title">{selectedStop.name}</h2>
                <p className="area-label">{selectedStop.area}</p>
                <div className="queue-counter">
                  <strong data-testid="selected-queue">
                    {stopQueue(state, selectedStop.id)}
                  </strong>
                  <div>
                    <span>people waiting</span>
                    <small>
                      {stopQueue(state, selectedStop.id) >= 30
                        ? "A little help would go a long way."
                        : "Room to breathe at this stop."}
                    </small>
                  </div>
                </div>
                <span className="eyebrow serving-label">
                  LINES SERVING THIS STOP
                </span>
                <div className="stop-lines">
                  {routes
                    .filter((r) => r.stops.includes(selectedStop.id))
                    .map((r) => (
                      <div className="stop-line" key={r.id}>
                        <div>
                          <span
                            className="route-code"
                            style={{ background: r.soft, color: r.color }}
                          >
                            {r.code}
                          </span>
                          <span>
                            <strong>{r.name}</strong>
                            <small>
                              {state.queues[selectedStop.id][r.id]} waiting ·{" "}
                              {eta(state, r.id, selectedStop.id) === null
                                ? "service interrupted"
                                : `next in ${eta(state, r.id, selectedStop.id)}s`}
                            </small>
                          </span>
                        </div>
                        <button
                          className="dispatch-stop"
                          disabled={state.buses.length >= maxFleet}
                          aria-label={`Send ${r.name} bus to ${selectedStop.name}`}
                          onClick={() => dispatch(r.id, selectedStop.id)}
                        >
                          <Plus size={14} /> Send bus
                        </button>
                      </div>
                    ))}
                </div>
                <p className="form-note">
                  Dispatch places a reserve bus at this stop.
                  <br />
                  Boarding begins immediately.
                </p>
              </>
            ) : (
              <>
                <div className="section-heading">
                  <span className="eyebrow">ROUTE INSPECTOR</span>
                  <RouteIcon size={18} />
                </div>
                <span
                  className="route-code big"
                  style={{
                    background: selectedRoute.soft,
                    color: selectedRoute.color,
                  }}
                >
                  {selectedRoute.code}
                </span>
                <h2>{selectedRoute.name}</h2>
                <p className="muted">
                  A continuous loop. Every stop, connected.
                </p>
                <div className="route-stop-list">
                  {selectedRoute.stops.map((id, i) => (
                    <button
                      key={id}
                      onClick={() => select({ kind: "stop", id })}
                    >
                      <i style={{ borderColor: selectedRoute.color }} />
                      <span>{stopById[id].name}</span>
                      <small>{state.queues[id][selectedRoute.id]}</small>
                    </button>
                  ))}
                </div>
                <label className="headway-label">
                  Automatic dispatch
                  <select
                    value={state.headways[selectedRoute.id]}
                    onChange={(e) =>
                      act({
                        type: "headway",
                        routeId: selectedRoute.id,
                        value: Number(e.target.value),
                      })
                    }
                  >
                    <option value={0}>Manual only</option>
                    <option value={20}>Every 20 simulation seconds</option>
                    <option value={40}>Every 40 simulation seconds</option>
                    <option value={60}>Every 60 simulation seconds</option>
                  </select>
                </label>
                <button
                  className="primary full"
                  disabled={state.buses.length >= maxFleet}
                  onClick={() => dispatch(selectedRoute.id)}
                >
                  <Plus size={16} /> Dispatch a bus
                </button>
                <p className="form-note">
                  Up to 18 buses across the network.
                  <br />
                  Automatic dispatch stops when the depot is empty.
                </p>
              </>
            )}
            {mode === "operator" && (
              <div className="activity-section">
                <div className="section-heading">
                  <h3>On the ground</h3>
                  <span className="live-dot" />
                </div>
                <div className="activity-list">
                  {state.events.slice(0, 4).map((e) => (
                    <div key={e.id} className={"activity-item " + e.kind}>
                      <i />
                      {
                        <div>
                          <p>{e.text}</p>
                          <time>{clock(e.time).slice(0, 5)}</time>
                        </div>
                      }
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
        <footer className="page-footer">
          <span>
            <span className="live-dot" /> A fictional network. A real
            simulation.
          </span>
          <span>
            Designed & built by{" "}
            <a href="https://github.com/adebolaowolabi32">Cynthia Owolabi</a>{" "}
            <span className="footer-dot">·</span> Inspired by Lagos, Nigeria
          </span>
        </footer>
      </main>
      {notice && (
        <div className="toast" role="status">
          <Check size={17} />
          {notice}
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {guide && (
        <Modal
          title="A little city. You're in charge."
          onClose={() => setGuide(false)}
        >
          <p className="modal-intro">
            TrafficDesk is a living, fictional transport network. Every bus,
            queue and ticket is connected.
          </p>
          <div className="guide-steps">
            <div>
              <span>01</span>
              <div>
                <h3>Make a little room.</h3>
                <p>
                  Start Rush hour, select Marina Central, and send buses to
                  bring the queue below 20.
                </p>
              </div>
            </div>
            <div>
              <span>02</span>
              <div>
                <h3>Expect the unexpected.</h3>
                <p>
                  Close the bridge, open the alternate route, or click a bus to
                  simulate a breakdown and repair it.
                </p>
              </div>
            </div>
            <div>
              <span>03</span>
              <div>
                <h3>See the other side.</h3>
                <p>
                  Choose Take a ride to join a queue, board a real simulated bus
                  and travel to your destination.
                </p>
              </div>
            </div>
          </div>
          <div className="guide-note">
            <Clock3 size={18} />
            <p>
              Use 3× or 8× to speed things up. Time pauses when this browser tab
              is hidden. Refreshing starts a new city.
            </p>
          </div>
          <p className="form-note">
            Original illustrated geography and synthetic demand. This is not a
            navigation service or a model of actual Lagos traffic. No real
            ticket purchases or external APIs.
          </p>
          <button className="primary full" onClick={() => setGuide(false)}>
            Let's get moving <ArrowRight size={17} />
          </button>
        </Modal>
      )}
      {resetOpen && (
        <Modal
          title="Start a fresh morning?"
          onClose={() => setResetOpen(false)}
        >
          <p className="modal-intro">
            This resets buses, queues, tickets and your challenge. Your current
            simulation will be replaced.
          </p>
          <div className="modal-actions">
            <button className="secondary" onClick={() => setResetOpen(false)}>
              Keep my city
            </button>
            <button
              className="primary"
              onClick={() => {
                act({ type: "reset" });
                setPaused(false);
                setSpeed(1);
                setSelection({ kind: "stop", id: "cms" });
                setActiveRoute("all");
                setResetOpen(false);
                setNotice("A fresh morning. The city is yours again.");
              }}
            >
              Reset city
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
function Metric({
  icon,
  title,
  value,
  detail,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  detail: string;
  color: string;
}) {
  return (
    <div className="metric">
      <div className={"metric-icon " + color}>{icon}</div>
      <div>
        <p>{title}</p>
        <strong>{value}</strong>
        <span>{detail}</span>
      </div>
    </div>
  );
}
function Insights({ state }: { state: State }) {
  const [comparison, setComparison] = useState<ReturnType<
    typeof compareRushHour
  > | null>(null);
  const max = Math.max(40, ...state.history.map((h) => h.waiting));
  return (
    <section className="insights-panel">
      <div className="eyebrow">THE CITY, BY THE MOMENT</div>
      <h2>Small decisions. Visible change.</h2>
      <p>Watch the queue respond as buses meet demand.</p>
      <div className="chart-heading">
        <span>Passengers waiting</span>
        <strong>{waiting(state)}</strong>
      </div>
      <svg
        viewBox="0 0 600 220"
        role="img"
        aria-label="Waiting passenger history for the last three simulation minutes"
      >
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7cb696" stopOpacity=".35" />
            <stop offset="100%" stopColor="#7cb696" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <line
              x1="30"
              x2="595"
              y1={20 + i * 55}
              y2={20 + i * 55}
              stroke="#e5e9df"
              strokeDasharray="4 4"
            />
            <text x="0" y={24 + i * 55} fontSize="10" fill="#819087">
              {Math.round(max * (1 - i / 3))}
            </text>
          </g>
        ))}
        <path
          d={`M30 185 ${state.history.map((h, i) => `L${30 + (i / Math.max(1, state.history.length - 1)) * 560} ${185 - (h.waiting / max) * 165}`).join(" ")} L590 185 Z`}
          fill="url(#chart-fill)"
        />
        <polyline
          points={state.history
            .map(
              (h, i) =>
                `${30 + (i / Math.max(1, state.history.length - 1)) * 560},${185 - (h.waiting / max) * 165}`,
            )
            .join(" ")}
          fill="none"
          stroke="#438b6c"
          strokeWidth="3"
        />
        <text x="30" y="212" fontSize="11" fill="#819087">
          {clock(state.history[0]?.time || 0)}
        </text>
        <text x="550" y="212" fontSize="11" fill="#819087">
          Now
        </text>
      </svg>
      <div className="insight-stats">
        <div>
          <span>Passengers arrived</span>
          <strong>{state.completed}</strong>
        </div>
        <div>
          <span>Average bus occupancy</span>
          <strong>
            {Math.round(
              (state.buses.reduce((n, b) => n + onboard(b), 0) /
                (state.buses.length * capacity)) *
                100,
            )}
            %
          </strong>
        </div>
      </div>
      <h3>Where the city is waiting</h3>
      <div className="queue-bars">
        {[...stops]
          .sort((a, b) => stopQueue(state, b.id) - stopQueue(state, a.id))
          .slice(0, 5)
          .map((s) => (
            <div key={s.id}>
              <span>{s.name}</span>
              <div>
                <i
                  style={{
                    width: `${(stopQueue(state, s.id) / Math.max(1, ...stops.map((s) => stopQueue(state, s.id)))) * 100}%`,
                  }}
                />
              </div>
              <strong>{stopQueue(state, s.id)}</strong>
            </div>
          ))}
      </div>
      <div className="comparison">
        <h3>Try the same morning, twice.</h3>
        <p>
          Compare normal service with three extra buses sent to Marina.
          Identical passenger demand, 120 simulation seconds.
        </p>
        <button
          className="secondary"
          onClick={() => setComparison(compareRushHour())}
        >
          Compare dispatch strategies <ArrowRight size={14} />
        </button>
        {comparison && (
          <>
            <table>
              <caption>Seed 42 · synthetic rush-hour experiment</caption>
              <thead>
                <tr>
                  <th>After 120s</th>
                  <th>6 buses</th>
                  <th>9 buses</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>People waiting</th>
                  <td>{comparison[0].waiting}</td>
                  <td>{comparison[1].waiting}</td>
                </tr>
                <tr>
                  <th>Journeys completed</th>
                  <td>{comparison[0].completed}</td>
                  <td>{comparison[1].completed}</td>
                </tr>
              </tbody>
            </table>
            <p>
              This separate experiment does not change your city. More buses add
              capacity; these results do not predict real-world traffic.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
