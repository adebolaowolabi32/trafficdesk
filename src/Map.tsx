import { useRef, useState } from "react";
import { Minus, Plus, LocateFixed, MoveUpRight } from "lucide-react";
import { routes, stops, path, segment, capacity } from "./network";
import { busPosition, onboard, stopQueue, type State } from "./simulation";
export type Selection = { kind: "stop" | "bus" | "route"; id: string };
export function NetworkMap({
  state,
  selection,
  onSelect,
  activeRoute,
}: {
  state: State;
  selection: Selection;
  onSelect: (s: Selection) => void;
  activeRoute: string;
}) {
  const [zoom, setZoom] = useState(1),
    [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(
    null,
  );
  const limit = (v: number) => Math.max(-200, Math.min(200, v));
  const keyboard = (e: React.KeyboardEvent, fn: () => void) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn();
    }
  };
  return (
    <section className="map-panel" aria-label="Interactive transit map">
      <div className="map-heading">
        <span className="live-dot" /> NETWORK LIVE{" "}
        <span className="map-heading-sep">/</span>{" "}
        <span>LAGOS, REIMAGINED</span>
      </div>
      <svg
        className="city-map"
        viewBox={`${550 - 550 / zoom + pan.x} ${380 - 380 / zoom + pan.y} ${1100 / zoom} ${760 / zoom}`}
        aria-label="Fictional Lagos transit network. Select a bus or stop to inspect it."
        onPointerDown={(e) => {
          if ((e.target as Element).closest("[data-interactive]")) return;
          drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const k = 1100 / e.currentTarget.getBoundingClientRect().width / zoom;
          setPan({
            x: limit(drag.current.px - (e.clientX - drag.current.x) * k),
            y: limit(drag.current.py - (e.clientY - drag.current.y) * k),
          });
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <defs>
          <pattern
            id="water"
            width="30"
            height="30"
            patternUnits="userSpaceOnUse"
          >
            <path d="M10 15h8" stroke="#b3d8d7" strokeWidth="1" opacity=".55" />
          </pattern>
          <pattern
            id="blocks"
            width="62"
            height="54"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-12)"
          >
            <rect
              x="5"
              y="6"
              width="48"
              height="38"
              rx="5"
              fill="#e5e6dc"
              stroke="#dedfd4"
            />
            <path d="M0 50h62M58 0v54" stroke="#fcfcf6" strokeWidth="5" />
          </pattern>
          <pattern
            id="park"
            width="18"
            height="18"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="9" cy="9" r="2" fill="#b4cba3" />
          </pattern>
          <clipPath id="land">
            <path d="M-150-100H570L540 105 490 175 365 220 315 330 180 380 50 365-100 410Z M280 380L395 320 575 300 640 330 650 410 580 520 440 535 300 475Z M655 230L770 205 920 250 1020 345 935 440 810 465 670 390 620 320Z M580 540L705 495 880 485 1050 460 1200 540 1220 640 975 680 765 655 670 695 570 665 500 610Z" />
          </clipPath>
          <filter id="bus-shadow" x="-80%" y="-80%" width="260%" height="260%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity=".18" />
          </filter>
        </defs>
        <rect x="-300" y="-300" width="1800" height="1400" fill="#dceeee" />
        <rect x="-300" y="-300" width="1800" height="1400" fill="url(#water)" />
        <g clipPath="url(#land)">
          <rect x="-150" y="-100" width="1500" height="1000" fill="#ecece2" />
          <rect
            x="-150"
            y="-100"
            width="1500"
            height="1000"
            fill="url(#blocks)"
          />
          {[
            [90, 80, 92, 85],
            [260, 245, 62, 44],
            [755, 255, 105, 65],
            [440, 360, 52, 60],
            [870, 510, 60, 48],
            [670, 575, 65, 35],
          ].map(([x, y, w, h], i) => (
            <g key={i}>
              <rect x={x} y={y} width={w} height={h} rx="14" fill="#d4dfc2" />
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                rx="14"
                fill="url(#park)"
              />
            </g>
          ))}
          <g fill="none" stroke="#fafbf5" strokeWidth="13">
            <path d="M60 100L180 200 145 360M100 20L215 140 295 195 340 180 405 60M-20 290L240 245 410 270M120 420L380 380 600 360M320 450L470 420 635 440M690 245L725 355 870 420 985 410M710 535L820 610 1020 610M565 605L795 540 1050 525" />
          </g>
          <g fill="none" stroke="#d5d6cb" strokeWidth="1">
            <path d="M60 100L180 200 145 360M100 20L215 140 295 195 340 180 405 60M-20 290L240 245 410 270M120 420L380 380 600 360M320 450L470 420 635 440M690 245L725 355 870 420 985 410M710 535L820 610 1020 610M565 605L795 540 1050 525" />
          </g>
        </g>
        <g fill="none" stroke="#a6bfbd" strokeWidth="14">
          <path d="M390 130L405 230 435 355M215 340L375 425M595 380L725 310M835 400L740 560M515 485L620 630M390 130L470 165 540 240 535 325 435 355" />
        </g>
        <g fill="none" stroke="#f7f7ef" strokeWidth="10">
          <path d="M390 130L405 230 435 355M215 340L375 425M595 380L725 310M835 400L740 560M515 485L620 630M390 130L470 165 540 240 535 325 435 355" />
        </g>
        <g className="district-labels">
          <text x="155" y="105">
            MAINLAND
          </text>
          <text x="358" y="312">
            LAGOS ISLAND
          </text>
          <text x="762" y="220">
            IKOYI
          </text>
          <text x="785" y="662">
            VICTORIA ISLAND
          </text>
          <text
            x="565"
            y="195"
            className="water-label"
            transform="rotate(-12 565 195)"
          >
            Lagos Lagoon
          </text>
          <text x="60" y="585" className="water-label">
            Five Cowrie Creek
          </text>
          <text x="810" y="725" className="water-label">
            Atlantic Ocean
          </text>
        </g>
        {routes.map((r) => (
          <g
            key={r.id}
            opacity={activeRoute === "all" || activeRoute === r.id ? 1 : 0.2}
            className="route-lines"
          >
            {r.stops.map((_, i) => (
              <g key={i}>
                <path
                  d={path(
                    segment(
                      r.id,
                      i,
                      state.closure &&
                        state.detour &&
                        r.id === "mainland" &&
                        i === 1,
                    ),
                  )}
                  stroke="#fffdf5"
                  strokeWidth="10"
                  fill="none"
                  strokeLinejoin="round"
                />
                <path
                  d={path(
                    segment(
                      r.id,
                      i,
                      state.closure &&
                        state.detour &&
                        r.id === "mainland" &&
                        i === 1,
                    ),
                  )}
                  stroke={r.color}
                  strokeWidth="4.5"
                  fill="none"
                  strokeLinejoin="round"
                  strokeDasharray={
                    state.closure &&
                    state.detour &&
                    r.id === "mainland" &&
                    i === 1
                      ? "9 6"
                      : undefined
                  }
                />
              </g>
            ))}
          </g>
        ))}
        {state.closure && (
          <g className="closure-marker" transform="translate(408 245)">
            <circle r="20" fill="#fff7ef" stroke="#d97855" strokeWidth="2" />
            <path d="M-8-8L8 8M8-8L-8 8" stroke="#c56747" strokeWidth="3" />
            <rect
              x="25"
              y="-13"
              width="114"
              height="26"
              rx="7"
              fill="#fff7ef"
            />
            <text x="34" y="5" fill="#a65032" fontSize="12" fontWeight="700">
              Bridge closed
            </text>
          </g>
        )}
        {stops.map((stop) => {
          const n = stopQueue(state, stop.id),
            selected = selection.kind === "stop" && selection.id === stop.id;
          const labelBelow = ["cms", "vi", "yaba", "oyingbo", "eko"].includes(
            stop.id,
          );
          return (
            <g
              key={stop.id}
              data-interactive="true"
              role="button"
              tabIndex={0}
              aria-label={`${stop.name} stop, ${n} waiting`}
              onClick={() => onSelect({ kind: "stop", id: stop.id })}
              onKeyDown={(e) =>
                keyboard(e, () => onSelect({ kind: "stop", id: stop.id }))
              }
              className="map-stop"
              transform={`translate(${stop.x} ${stop.y})`}
            >
              <circle r="24" fill="transparent" />
              {(n >= 30 || selected) && (
                <circle
                  r={selected ? 23 : 19}
                  fill={n >= 30 ? "#e9b763" : "#79b498"}
                  opacity=".22"
                  className={n >= 30 ? "queue-halo" : ""}
                />
              )}
              <circle
                r={selected ? 10 : 7}
                stroke={selected ? "#253d34" : "#75877e"}
                strokeWidth="2.5"
                fill="#fffef6"
              />
              <circle r="2" fill="#536f60" />
              <g aria-hidden="true">
                {Array.from({ length: Math.min(n, 12) }, (_, i) => (
                  <g
                    className="passenger-glyph"
                    key={i}
                    transform={`translate(${-23 + (i % 6) * 8} ${(labelBelow ? -33 : 33) + Math.floor(i / 6) * 13})`}
                  >
                    <circle cy="-4" r="2" />
                    <path d="M0 0v5m-2 3 2-3 2 3" />
                  </g>
                ))}
              </g>
              <text
                x="0"
                y={labelBelow ? 28 : -18}
                textAnchor="middle"
                className="stop-label"
              >
                {stop.name}
              </text>
              {n > 0 && (
                <g transform={`translate(17 ${labelBelow ? -13 : 13})`}>
                  <rect
                    x="0"
                    y="-8"
                    width={n >= 100 ? 33 : 27}
                    height="19"
                    rx="7"
                    fill={n >= 30 ? "#f5cf8b" : "#fcfcf6"}
                    stroke={n >= 30 ? "#dfb96e" : "#d4d9cf"}
                  />
                  <text
                    x={n >= 100 ? 16.5 : 13.5}
                    y="5"
                    textAnchor="middle"
                    className="queue-label"
                  >
                    {n}
                  </text>
                </g>
              )}
            </g>
          );
        })}
        {state.buses.map((bus) => {
          const p = busPosition(bus),
            r = routes.find((r) => r.id === bus.routeId)!,
            selected = selection.kind === "bus" && selection.id === bus.id;
          return (
            <g
              key={bus.id}
              data-interactive="true"
              role="button"
              tabIndex={0}
              aria-label={`${bus.id}, ${r.name}, ${onboard(bus)} of ${capacity} seats${bus.broken ? ", broken down" : ""}`}
              className="map-bus"
              onClick={() => onSelect({ kind: "bus", id: bus.id })}
              onKeyDown={(e) =>
                keyboard(e, () => onSelect({ kind: "bus", id: bus.id }))
              }
              style={{ transform: `translate(${p.x}px,${p.y}px)` }}
              opacity={activeRoute === "all" || activeRoute === r.id ? 1 : 0.4}
            >
              {state.time - bus.servicedAt < 2 && (
                <g aria-hidden="true">
                  {Array.from(
                    { length: Math.min(5, bus.boardedNow) },
                    (_, i) => {
                      const t = Math.min(1, (state.time - bus.servicedAt) / 2);
                      return (
                        <g
                          className="passenger-glyph"
                          key={`in${i}`}
                          transform={`translate(${(24 + i * 5) * (1 - t)} ${18 * (1 - t)})`}
                          opacity={1 - t * 0.7}
                        >
                          <circle cy="-4" r="2" />
                          <path d="M0 0v5m-2 3 2-3 2 3" />
                        </g>
                      );
                    },
                  )}
                  {Array.from(
                    { length: Math.min(5, bus.alightedNow) },
                    (_, i) => {
                      const t = Math.min(1, (state.time - bus.servicedAt) / 2);
                      return (
                        <g
                          className="passenger-glyph"
                          key={`out${i}`}
                          transform={`translate(${(-24 - i * 5) * t} ${-18 * t})`}
                          opacity={1 - t * 0.7}
                        >
                          <circle cy="-4" r="2" />
                          <path d="M0 0v5m-2 3 2-3 2 3" />
                        </g>
                      );
                    },
                  )}
                </g>
              )}
              <circle r="21" fill="transparent" />
              {selected && (
                <circle
                  r="24"
                  fill="none"
                  stroke={r.color}
                  strokeWidth="2"
                  strokeDasharray="3 3"
                />
              )}
              <g transform={`rotate(${p.angle})`} filter="url(#bus-shadow)">
                <rect
                  x="-15"
                  y="-9"
                  width="30"
                  height="18"
                  rx="5"
                  fill={bus.broken ? "#bf6552" : r.color}
                  stroke="white"
                  strokeWidth="2"
                />
                <rect
                  x="7"
                  y="-5"
                  width="4"
                  height="10"
                  rx="1.5"
                  fill="#fff"
                  opacity=".9"
                />
                <path
                  d="M-9-4h8M-9 0h8M-9 4h8"
                  stroke="white"
                  strokeWidth="1.5"
                  opacity=".7"
                />
              </g>
              {bus.broken && (
                <g transform="translate(13 -16)">
                  <circle r="8" fill="#b4503b" stroke="#fff" strokeWidth="2" />
                  <text
                    textAnchor="middle"
                    y="4"
                    fill="#fff"
                    fontSize="12"
                    fontWeight="800"
                  >
                    !
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      <div className="map-compass">
        <MoveUpRight size={22} />
        <span>N</span>
      </div>
      <div className="map-tools">
        <button
          aria-label="Zoom in"
          disabled={zoom >= 2}
          onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
        >
          <Plus size={17} />
        </button>
        <button
          aria-label="Zoom out"
          disabled={zoom <= 0.75}
          onClick={() => setZoom((z) => Math.max(0.75, z - 0.25))}
        >
          <Minus size={17} />
        </button>
        <button
          aria-label="Reset map view"
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
        >
          <LocateFixed size={17} />
        </button>
      </div>
      <div className="map-legend">
        <span>
          <i className="legend-bus" /> Moving bus
        </span>
        <span>
          <i className="legend-stop" /> Bus stop
        </span>
        <span>
          <i className="legend-queue" /> Busy stop
        </span>
      </div>
      <div className="map-credit">
        Original illustrated map · fictional routes · drag to explore
      </div>
    </section>
  );
}
