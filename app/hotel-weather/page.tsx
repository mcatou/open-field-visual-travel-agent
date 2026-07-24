"use client";

import { useReducer } from "react";

import styles from "./hotel-weather.module.css";
import {
  HOTELS,
  INITIAL_STATE,
  MODE_COPY,
  getHotel,
  hotelWeatherReducer,
  type FollowUpMode,
  type HotelId,
} from "./model";

const WEATHER_EVIDENCE = [
  {
    label: "Recorded temperature band",
    value: "21–25°C",
    note: "Archived Lake Toya area snapshots",
    tone: "cool",
  },
  {
    label: "Model disagreement",
    value: "0–95% rain",
    note: "One archived comparison window",
    tone: "caution",
  },
  {
    label: "Decision rule",
    value: "Refresh first",
    note: "Area weather is not room evidence",
    tone: "neutral",
  },
] as const;

function FollowUpButton({
  mode,
  active,
  onClick,
  children,
}: {
  mode: Exclude<FollowUpMode, "balanced">;
  active: boolean;
  onClick: (mode: Exclude<FollowUpMode, "balanced">) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className={`${styles.followUp} ${active ? styles.followUpActive : ""}`}
      type="button"
      onClick={() => onClick(mode)}
      aria-pressed={active}
    >
      <span>Follow-up</span>
      {children}
    </button>
  );
}

export default function HotelWeatherPage() {
  const [state, dispatch] = useReducer(hotelWeatherReducer, INITIAL_STATE);
  const view = MODE_COPY[state.mode];
  const selectedHotel = getHotel(state.selectedHotelId);
  const selectedPhoto = selectedHotel.photos[state.activeImage];

  const selectHotel = (hotelId: HotelId) => {
    dispatch({ type: "selectHotel", hotelId });
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>OPEN FIELD · VISUAL TRAVEL PLANNER</p>
          <h1>Which Lake Toya stay survives a wet forecast?</h1>
        </div>
        <div className={styles.headerMeta}>
          <span>Protected demo</span>
          <span>Public hotel facts only</span>
        </div>
      </header>

      <section className={styles.weatherRibbon} aria-label="Weather evidence">
        <div className={styles.weatherIntro}>
          <span className={styles.liveDot} />
          <div>
            <strong>Archived, coarse weather evidence</strong>
            <small>Not a live forecast or booking recommendation</small>
          </div>
        </div>
        {WEATHER_EVIDENCE.map((item) => (
          <button
            className={`${styles.weatherCell} ${styles[item.tone]}`}
            type="button"
            key={item.label}
            onClick={() => dispatch({ type: "toggleProvenance" })}
          >
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.note}</small>
          </button>
        ))}
      </section>

      <section className={styles.workspace}>
        <aside className={styles.mapPanel} aria-label="Lake Toya hotel map">
          <div className={styles.panelHeading}>
            <div>
              <span>01 · Place context</span>
              <h2>Lake Toya</h2>
            </div>
            <button
              type="button"
              className={styles.sourceButton}
              onClick={() => dispatch({ type: "toggleProvenance" })}
            >
              Sources
            </button>
          </div>

          <div className={styles.mapStage}>
            <svg
              className={styles.mapArtwork}
              viewBox="0 0 100 100"
              role="img"
              aria-label="Stylized Lake Toya area map with two exact hotel pins"
            >
              <defs>
                <filter id="lakeGlow">
                  <feGaussianBlur stdDeviation="1.8" />
                </filter>
              </defs>
              <path
                className={styles.terrainLine}
                d="M-10 22 C24 4, 58 10, 112 24"
              />
              <path
                className={styles.terrainLine}
                d="M-5 78 C22 55, 72 54, 110 76"
              />
              <path
                className={styles.lakeGlow}
                d="M28 23 C46 8, 77 16, 83 38 C88 56, 69 78, 45 73 C24 69, 15 42, 28 23 Z"
                filter="url(#lakeGlow)"
              />
              <path
                className={styles.lake}
                d="M28 23 C46 8, 77 16, 83 38 C88 56, 69 78, 45 73 C24 69, 15 42, 28 23 Z"
              />
              <path className={styles.island} d="M55 38 l6 3 -2 7 -7 1 -3 -6 Z" />
              <text className={styles.lakeLabel} x="52" y="30">
                LAKE TOYA
              </text>
              <path
                className={styles.relationshipLine}
                d="M38 57 C47 58, 57 62, 66 66"
              />
            </svg>

            {HOTELS.map((hotel, index) => {
              const selected = hotel.id === state.selectedHotelId;
              const recommended = hotel.id === view.recommendation;
              return (
                <button
                  key={hotel.id}
                  type="button"
                  className={`${styles.mapPin} ${
                    selected ? styles.mapPinSelected : ""
                  }`}
                  style={{ left: `${hotel.mapX}%`, top: `${hotel.mapY}%` }}
                  onClick={() => selectHotel(hotel.id)}
                  aria-label={`Select ${hotel.name}`}
                >
                  <span>{index + 1}</span>
                  <strong>{hotel.shortName}</strong>
                  {recommended ? <em>Best fit now</em> : null}
                </button>
              );
            })}
          </div>

          <div className={styles.mapReadout}>
            <span>Selected pin</span>
            <strong>{selectedHotel.shortName}</strong>
            <small>
              {selectedHotel.latitude.toFixed(3)},{" "}
              {selectedHotel.longitude.toFixed(3)}
            </small>
          </div>
        </aside>

        <section className={styles.answerPanel} aria-live="polite">
          <div className={styles.answerHeader}>
            <div>
              <span>02 · Visual answer</span>
              <small>{view.label}</small>
            </div>
            {state.mode !== "balanced" ? (
              <button
                type="button"
                className={styles.resetButton}
                onClick={() => dispatch({ type: "reset" })}
              >
                Reset
              </button>
            ) : null}
          </div>

          <p className={styles.verdict}>{view.verdict}</p>

          <div className={styles.branchStem} aria-hidden="true">
            <span />
          </div>

          <div className={styles.branches}>
            {HOTELS.map((hotel) => {
              const selected = hotel.id === state.selectedHotelId;
              const recommended = hotel.id === view.recommendation;
              return (
                <button
                  type="button"
                  key={hotel.id}
                  className={`${styles.branchCard} ${
                    selected ? styles.branchSelected : ""
                  } ${recommended ? styles.branchRecommended : ""}`}
                  onClick={() => selectHotel(hotel.id)}
                >
                  <span className={styles.branchLabel}>
                    {hotel.branchLabel}
                  </span>
                  <strong>{hotel.branchTitle}</strong>
                  <small>{view.reasons[hotel.id]}</small>
                  <div className={styles.branchFooter}>
                    <span>{recommended ? "Recommended now" : "Compare"}</span>
                    <span aria-hidden="true">→</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className={styles.flowConnector}>
            <span>Change one priority</span>
          </div>

          <div className={styles.followUps}>
            <FollowUpButton
              mode="rainproof"
              active={state.mode === "rainproof"}
              onClick={(mode) => dispatch({ type: "applyFollowUp", mode })}
            >
              Make rain the priority
            </FollowUpButton>
            <FollowUpButton
              mode="private"
              active={state.mode === "private"}
              onClick={(mode) => dispatch({ type: "applyFollowUp", mode })}
            >
              Private sauna over dinner
            </FollowUpButton>
          </div>

          <div className={styles.patchNote}>
            <span>PATCHED, NOT REBUILT</span>
            <p>
              The selected pin, open hotel and photo stay in place while the
              branch recommendation changes.
            </p>
          </div>
        </section>

        <aside className={styles.detailPanel} aria-label="Selected hotel detail">
          <div className={styles.photoFrame}>
            {/* Remote evidence images keep their original source URLs and are not proxied. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedPhoto.src}
              alt={`${selectedHotel.name}: ${selectedPhoto.label}`}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <div className={styles.photoShade} />
            <div className={styles.photoCaption}>
              <span>{selectedPhoto.label}</span>
              <a
                href={selectedPhoto.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Official source ↗
              </a>
            </div>
            <div className={styles.carouselControls}>
              <button
                type="button"
                onClick={() =>
                  dispatch({ type: "nextImage", direction: -1 })
                }
                aria-label="Previous official image"
              >
                ‹
              </button>
              <span>
                {state.activeImage + 1}/{selectedHotel.photos.length}
              </span>
              <button
                type="button"
                onClick={() =>
                  dispatch({ type: "nextImage", direction: 1 })
                }
                aria-label="Next official image"
              >
                ›
              </button>
            </div>
          </div>

          <div className={styles.detailBody}>
            <span className={styles.detailKicker}>03 · Selected stay</span>
            <h2>{selectedHotel.name}</h2>
            <ul className={styles.factList}>
              {selectedHotel.publicFacts.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>

            <details className={styles.unresolved}>
              <summary>What is still unverified?</summary>
              <ul>
                {selectedHotel.unresolved.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </details>

            <div className={styles.detailActions}>
              <a
                href={selectedHotel.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open official hotel page ↗
              </a>
              <button
                type="button"
                onClick={() => dispatch({ type: "toggleProvenance" })}
              >
                Evidence and provenance
              </button>
            </div>
          </div>
        </aside>
      </section>

      {state.provenanceOpen ? (
        <section
          className={styles.provenanceDrawer}
          aria-label="Evidence and provenance"
        >
          <div className={styles.provenanceHeader}>
            <div>
              <span>04 · Why this answer is bounded</span>
              <h2>Evidence and freshness</h2>
            </div>
            <button
              type="button"
              onClick={() => dispatch({ type: "toggleProvenance" })}
              aria-label="Close evidence and provenance"
            >
              ×
            </button>
          </div>
          <div className={styles.provenanceGrid}>
            <article>
              <span>Hotel evidence</span>
              <strong>Official public pages</strong>
              <p>
                The demo uses public hotel names, public coordinates and
                official property pages. It excludes bookings, private
                comments, email evidence and live availability claims.
              </p>
            </article>
            <article>
              <span>Weather evidence</span>
              <strong>Archived area-level comparison</strong>
              <p>
                Values summarize coarse Lake Toya snapshots from public weather
                routes. They show uncertainty; they do not prove conditions at
                a room or choose a booking.
              </p>
            </article>
            <article>
              <span>Refresh rule</span>
              <strong>Run again before a real decision</strong>
              <p>
                Forecast evidence decays daily. Room terms, prices and
                availability require a fresh official check.
              </p>
            </article>
          </div>
          <div className={styles.sourceLinks}>
            <a
              href="https://www.bourou-toya.com/room/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Bourou official rooms
            </a>
            <a
              href="https://www.hikarino-uta.com/en/hotspring/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Hikari no uta official baths
            </a>
            <a
              href="https://www.jma.go.jp/bosai/forecast/"
              target="_blank"
              rel="noopener noreferrer"
            >
              JMA forecasts
            </a>
            <a
              href="https://open-meteo.com/en/docs"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open-Meteo methodology
            </a>
          </div>
        </section>
      ) : null}
    </main>
  );
}
