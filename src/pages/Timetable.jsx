import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";
import {
  DAY_SHORT,
  MISSING_CLASS_INFO,
  TIMETABLE_DAYS,
  loadStudentTimetable,
  periodStatus,
  subscribeToTimetable,
  toHHMM,
  todayName,
} from "../services/timetableService";

const TABS = [
  { id: "week", label: "Complete Timetable" },
  { id: "day", label: "Today / Per-Day" },
];

function groupByDay(rows) {
  return rows.reduce((acc, row) => {
    (acc[row.day] ||= []).push(row);
    return acc;
  }, {});
}

function PeriodTime({ row }) {
  return (
    <span className="period-time">
      {toHHMM(row.start_time)} &ndash; {toHHMM(row.end_time)}
    </span>
  );
}

function SubjectBlock({ row }) {
  return (
    <span className="cell-subject">
      <strong>{row.subject}</strong>
      <span className="subject-meta">
        {[row.subject_code, row.faculty].filter(Boolean).join(" • ") || "—"}
      </span>
    </span>
  );
}

/* ============================================================
   COMPLETE TIMETABLE — full Mon–Sat week
   ============================================================ */

function CompleteTimetable({ rows }) {
  const byDay = useMemo(() => groupByDay(rows), [rows]);
  const today = todayName();

  return (
    <div className="timetable-week">
      {TIMETABLE_DAYS.map((day) => {
        const dayRows = byDay[day] || [];
        const isToday = day === today;

        return (
          <section
            key={day}
            className={`timetable-day-block${isToday ? " is-today" : ""}`}
          >
            <div className="timetable-day-header">
              <h3 className="timetable-day-name">{day}</h3>
              <span className="timetable-day-count">
                {isToday && <span className="today-tag">Today</span>}
                {dayRows.length} {dayRows.length === 1 ? "period" : "periods"}
              </span>
            </div>

            {dayRows.length === 0 ? (
              <p className="timetable-day-empty">No classes scheduled.</p>
            ) : (
              <>
                {/* Desktop table */}
                <div className="table-responsive desktop-only">
                  <table className="custom-data-table timetable-table">
                    <thead>
                      <tr>
                        <th style={{ width: "64px" }}>Period</th>
                        <th style={{ width: "150px" }}>Time</th>
                        <th>Subject</th>
                        <th style={{ width: "150px" }}>Faculty</th>
                        <th style={{ width: "110px" }}>Room</th>
                        <th style={{ width: "110px", textAlign: "right" }}>
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {dayRows.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <span className="period-badge">
                              {row.period_number}
                            </span>
                          </td>
                          <td className="cell-time">
                            <PeriodTime row={row} />
                          </td>
                          <td>
                            <SubjectBlock row={row} />
                          </td>
                          <td className="cell-muted">{row.faculty}</td>
                          <td>
                            <span className="room-badge-plain">
                              {row.room}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <Link
                              to={`/student/map?dest=r_${row.room}`}
                              className="btn-navigate-sm"
                            >
                              🧭 Navigate
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="timetable-period-cards mobile-only">
                  {dayRows.map((row) => (
                    <div key={row.id} className="timetable-period-card">
                      <div className="timetable-period-card-head">
                        <span className="period-badge">
                          P{row.period_number}
                        </span>
                        <PeriodTime row={row} />
                      </div>
                      <strong className="timetable-period-subject">
                        {row.subject}
                      </strong>
                      <span className="subject-meta">{row.faculty}</span>
                      <span className="room-badge-plain timetable-period-room">
                        {row.room}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}

/* ============================================================
   PER-DAY TIMETABLE — day selector + today panel
   ============================================================ */

function NowPanel({ row, tone, title, emptyText }) {
  return (
    <div className={`now-panel now-${tone}`}>
      <span className="now-panel-label">{title}</span>
      {row ? (
        <>
          <strong className="now-panel-subject">{row.subject}</strong>
          <span className="now-panel-meta">
            {row.faculty} • {row.room}
          </span>
          <span className="now-panel-time">
            {toHHMM(row.start_time)} &ndash; {toHHMM(row.end_time)}
            {row.period_number ? ` • Period ${row.period_number}` : ""}
          </span>
        </>
      ) : (
        <span className="now-panel-meta">{emptyText}</span>
      )}
    </div>
  );
}

function PerDayTimetable({ rows }) {
  const today = todayName();
  const [selectedDay, setSelectedDay] = useState(today);

  const byDay = useMemo(() => groupByDay(rows), [rows]);
  const dayRows = byDay[selectedDay] || [];

  // Recompute status every minute so "current period" stays accurate.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const withStatus = useMemo(
    () => dayRows.map((row) => ({ row, status: periodStatus(row, now) })),
    [dayRows, now],
  );

  const current = withStatus.find((p) => p.status === "current")?.row;
  const upcoming =
    withStatus.find((p) => p.status === "upcoming")?.row;

  return (
    <div className="timetable-perday">
      {/* Today's summary — always visible in the per-day tab */}
      {selectedDay === today && (
        <div className="today-panel">
          <div className="today-panel-head">
            <h3 className="today-panel-title">Today&apos;s Timetable</h3>
            <span className="today-panel-date">
              {now.toLocaleDateString("en-US", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </span>
          </div>

          {(byDay[today] || []).length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">☕</div>
              <h3>No classes today</h3>
              <p>Enjoy the day. Your next scheduled class will appear here.</p>
            </div>
          ) : (
            <>
              <div className="now-panel-grid">
                <NowPanel
                  row={current}
                  tone="current"
                  title="Current period"
                  emptyText="No class in progress right now."
                />
                <NowPanel
                  row={upcoming}
                  tone="upcoming"
                  title="Upcoming period"
                  emptyText="All scheduled periods for today are done."
                />
              </div>

              <div className="table-card">
                <div className="table-header-meta">
                  <span className="total-badge">
                    {(byDay[today] || []).length} periods today
                  </span>
                </div>
                <div className="today-progress-list">
                  {withStatus.map(({ row, status }) => (
                    <div
                      key={row.id}
                      className={`today-progress-row is-${status}`}
                    >
                      <span className="period-badge">{row.period_number}</span>
                      <div className="today-progress-body">
                        <strong>{row.subject}</strong>
                        <span className="subject-meta">{row.faculty}</span>
                      </div>
                      <span className="room-badge-plain">{row.room}</span>
                      <span className="today-status-tag">{status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Day selector — pills on desktop, dropdown on mobile */}
      <div className="day-picker desktop-only">
        {TIMETABLE_DAYS.map((day) => (
          <button
            key={day}
            className={`pill-btn${selectedDay === day ? " active" : ""}`}
            onClick={() => setSelectedDay(day)}
          >
            {DAY_SHORT[day]}
            {day === today && " •"}
          </button>
        ))}
      </div>

      <div className="day-picker-select mobile-only">
        <label htmlFor="timetable-day-select">Select day</label>
        <select
          id="timetable-day-select"
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.target.value)}
        >
          {TIMETABLE_DAYS.map((day) => (
            <option key={day} value={day}>
              {day}
              {day === today ? " (Today)" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Selected day timetable */}
      <section className="timetable-day-block">
        <div className="timetable-day-header">
          <h3 className="timetable-day-name">
            {selectedDay}
            {selectedDay === today && <span className="today-tag">Today</span>}
          </h3>
          <span className="timetable-day-count">
            {dayRows.length} {dayRows.length === 1 ? "period" : "periods"}
          </span>
        </div>

        {dayRows.length === 0 ? (
          <p className="timetable-day-empty">No classes scheduled.</p>
        ) : (
          <>
            <div className="table-responsive desktop-only">
              <table className="custom-data-table timetable-table">
                <thead>
                  <tr>
                    <th style={{ width: "64px" }}>Period</th>
                    <th style={{ width: "150px" }}>Time</th>
                    <th>Subject</th>
                    <th style={{ width: "150px" }}>Faculty</th>
                    <th style={{ width: "110px" }}>Room</th>
                    <th style={{ width: "110px", textAlign: "right" }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dayRows.map((row) => {
                    const status = periodStatus(row, now);
                    return (
                      <tr
                        key={row.id}
                        className={
                          selectedDay === today ? `row-${status}` : ""
                        }
                      >
                        <td>
                          <span className="period-badge">
                            {row.period_number}
                          </span>
                        </td>
                        <td className="cell-time">
                          <PeriodTime row={row} />
                        </td>
                        <td>
                          <SubjectBlock row={row} />
                        </td>
                        <td className="cell-muted">{row.faculty}</td>
                        <td>
                          <span className="room-badge-plain">
                            {row.room}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <Link
                            to={`/student/map?dest=r_${row.room}`}
                            className="btn-navigate-sm"
                          >
                            🧭 Navigate
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="timetable-period-cards mobile-only">
              {dayRows.map((row) => {
                const status = periodStatus(row, now);
                return (
                  <div
                    key={row.id}
                    className={`timetable-period-card${selectedDay === today ? ` is-${status}` : ""}`}
                  >
                    <div className="timetable-period-card-head">
                      <span className="period-badge">
                        P{row.period_number}
                      </span>
                      <PeriodTime row={row} />
                    </div>
                    <strong className="timetable-period-subject">
                      {row.subject}
                    </strong>
                    <span className="subject-meta">{row.faculty}</span>
                    <span className="room-badge-plain timetable-period-room">
                      {row.room}
                    </span>
                    {selectedDay === today && (
                      <span className="today-status-tag">{status}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

/* ============================================================
   PAGE
   ============================================================ */

export default function Timetable() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("week");
  const [state, setState] = useState({
    loading: true,
    rows: [],
    classKey: null,
    status: "ready",
    missing: [],
  });

  const load = useCallback(async () => {
    const result = await loadStudentTimetable(profile);
    setState({
      loading: false,
      rows: result.rows,
      classKey: result.classKey,
      status: result.status,
      missing: result.missing,
    });
  }, [profile]);

  useEffect(() => {
    setState((s) => ({ ...s, loading: true }));
    load();
  }, [load]);

  // Live updates when an admin edits the timetable, plus a refresh
  // whenever the student returns to the tab.
  useEffect(() => {
    const unsubscribe = subscribeToTimetable(load);
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  const { rows, classKey, status, loading } = state;

  return (
    <AppLayout
      title="My Timetable"
      subtitle={
        classKey
          ? `${classKey.branch} • Year ${classKey.year} • Section ${classKey.section} • Sem ${classKey.semester}`
          : "Your class schedule"
      }
    >
      <div className="timetable-container">
        <div className="student-tab-bar">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? "active" : ""}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="table-card">
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your timetable...</p>
            </div>
          </div>
        ) : status === "missing-class" ? (
          <div className="table-card">
            <div className="empty-state">
              <div className="empty-icon">⚠️</div>
              <h3>Class information unavailable</h3>
              <p>{MISSING_CLASS_INFO}</p>
            </div>
          </div>
        ) : status === "empty" ? (
          <div className="table-card">
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h3>No timetable published yet</h3>
              <p>
                Your timetable for this class has not been published. Please
                check back later or contact the administrator.
              </p>
            </div>
          </div>
        ) : activeTab === "week" ? (
          <CompleteTimetable rows={rows} />
        ) : (
          <PerDayTimetable rows={rows} />
        )}
      </div>
    </AppLayout>
  );
}