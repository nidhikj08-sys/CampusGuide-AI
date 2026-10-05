import { supabase } from "../supabase";

const LOCAL_TIMETABLE_KEY = "campusguide_timetable_data";
const LOCAL_SHIFTS_KEY = "campusguide_shifts_data";

// The timetable week, in display order. Sunday is intentionally excluded
// because the reference schedule runs Monday through Saturday.
export const TIMETABLE_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const DAY_SHORT = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
};

export const YEARS = [1, 2, 3, 4, 5];
export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export const SECTIONS = ["A", "B", "C", "D", "E", "F"];

export const MISSING_CLASS_INFO =
  "Your class information is not available. Please contact the administrator.";

// ============================================ //
// NORMALIZATION                                //
// ============================================ //

// "3rd Year" / "Year 3" / "3" -> 3
// "5th" / "Semester 5" / "5" -> 5
export function toNum(value) {
  if (value === null || value === undefined) return null;
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return null;
  const n = parseInt(digits, 10);
  return Number.isFinite(n) ? n : null;
}

// Resolves the branch code for a profile. Prefers the explicit
// `branch` column, then maps the free-text `department`, then falls
// back to the uppercased department. Mirrors public.cg_branch_code()
// in supabase/schema_timetable.sql.
export function toBranchCode(branch, department) {
  const explicit = String(branch ?? "").trim();
  if (explicit) return explicit.toUpperCase();

  const dept = String(department ?? "").trim();
  if (!dept) return null;
  const d = dept.toLowerCase();

  if (/\bcse\b/.test(d) || d.includes("computer science")) return "CSE";
  if (/\bece\b/.test(d) || (d.includes("electronics") && d.includes("communication")))
    return "ECE";
  if (/\bmech\b/.test(d) || d.includes("mechanical")) return "MECH";
  if (/\bcivil\b/.test(d)) return "CIVIL";
  if (/\bise\b/.test(d) || d.includes("information science")) return "ISE";
  if (/\bmath\b/.test(d) || d.includes("mathematics")) return "MATHS";

  return dept.toUpperCase().replace(/\s+/g, " ");
}

// ============================================ //
// CLASS RESOLUTION (LOGIN -> PROFILE -> CLASS) //
// ============================================ //

/**
 * Builds the class key a timetable is keyed on.
 * Returns `{ ok: true, year, branch, section, semester }` only when all
 * four values are present. Otherwise `{ ok: false, missing: [...] }`.
 * Never guesses or falls back to another section.
 */
export function resolveClass(profile) {
  if (!profile) {
    return { ok: false, missing: ["profile"] };
  }

  const year = toNum(profile.year);
  const branch = toBranchCode(profile.branch, profile.department);
  const section = String(profile.section ?? "").trim().toUpperCase();
  const semester = toNum(profile.semester);

  const missing = [];
  if (!year) missing.push("year");
  if (!branch) missing.push("branch");
  if (!section) missing.push("section");
  if (!semester) missing.push("semester");

  if (missing.length > 0) return { ok: false, missing };

  return { ok: true, year, branch, section, semester };
}

// ============================================ //
// LOCAL STORAGE FALLBACK                      //
// Used when the timetable table is not deployed yet, and by the
// demo logins which have no auth.users row and therefore no RLS access.
// ============================================ //

function getLocalTimetable() {
  try {
    const raw = localStorage.getItem(LOCAL_TIMETABLE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Local timetable read error:", err);
    return [];
  }
}

function saveLocalTimetable(rows) {
  try {
    localStorage.setItem(LOCAL_TIMETABLE_KEY, JSON.stringify(rows));
  } catch (err) {
    console.error("Local timetable write error:", err);
  }
}

function sameClass(row, cls) {
  return (
    toNum(row.year) === cls.year &&
    String(row.branch ?? "").trim().toUpperCase() === cls.branch &&
    String(row.section ?? "").trim().toUpperCase() === cls.section &&
    toNum(row.semester) === cls.semester
  );
}

const DAY_ORDER = TIMETABLE_DAYS.reduce((acc, d, i) => ({ ...acc, [d]: i }), {});

function sortRows(rows) {
  return [...rows].sort((a, b) => {
    const dayDiff = (DAY_ORDER[a.day] ?? 99) - (DAY_ORDER[b.day] ?? 99);
    if (dayDiff !== 0) return dayDiff;
    return toNum(a.period_number) - toNum(b.period_number);
  });
}

// ============================================ //
// TIME HELPERS                                //
// Postgres `time` columns come back as "09:00:00".
// ============================================ //

export function toHHMM(value) {
  if (!value) return "";
  return String(value).slice(0, 5);
}

function toMinutes(hhmm) {
  const [h, m] = toHHMM(hhmm).split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

/** Minutes elapsed since midnight for a Date. */
function nowMinutes(date = new Date()) {
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * Classifies a period relative to the current time.
 * "completed" | "current" | "upcoming"
 */
export function periodStatus(row, date = new Date()) {
  const start = toMinutes(row.start_time);
  const end = toMinutes(row.end_time);
  if (start === null || end === null) return "upcoming";
  const now = nowMinutes(date);
  if (now >= end) return "completed";
  if (now >= start) return "current";
  return "upcoming";
}

export function todayName(date = new Date()) {
  const name = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ][date.getDay()];
  // Sunday has no classes in the reference schedule.
  return name === "Sunday" ? "Monday" : name;
}

// ============================================ //
// STUDENT READ                                //
// ============================================ //

/**
 * Loads the timetable for a resolved class.
 * Returns `{ rows, source }` where source is "database" or "local".
 */
export async function getTimetableForClass(cls) {
  if (!cls || !cls.ok) {
    return { rows: [], source: "database" };
  }

  try {
    const { data, error } = await supabase
      .from("timetable")
      .select("*")
      .eq("year", cls.year)
      .eq("branch", cls.branch)
      .eq("section", cls.section)
      .eq("semester", cls.semester);

    if (error) throw error;

    // An empty result from a working table is a legitimate
    // "no timetable published yet", not a reason to fall back.
    return { rows: sortRows(data || []), source: "database" };
  } catch (err) {
    // Table not deployed yet, or RLS denied (demo logins).
    console.warn("Timetable DB read failed, using local cache:", err.message);
  }

  return {
    rows: sortRows(getLocalTimetable().filter((r) => sameClass(r, cls))),
    source: "local",
  };
}

/**
 * Full student-facing loader.
 * Returns `{ status, rows, source, classKey, missing }` where status is
 * "ready" | "missing-class" | "empty".
 */
export async function loadStudentTimetable(profile) {
  const classKey = resolveClass(profile);

  if (!classKey.ok) {
    return {
      status: "missing-class",
      rows: [],
      source: "database",
      classKey: null,
      missing: classKey.missing,
    };
  }

  const { rows, source } = await getTimetableForClass(classKey);

  return {
    status: rows.length > 0 ? "ready" : "empty",
    rows,
    source,
    classKey: { ...classKey },
    missing: [],
  };
}

// ============================================ //
// ADMIN READ                                  //
// ============================================ //

/** Distinct values already present, so admin dropdowns never invent data. */
export async function getTimetableFacets() {
  let rows = [];
  try {
    const { data, error } = await supabase
      .from("timetable")
      .select("year,branch,section,semester,day,period_number");
    if (error) throw error;
    rows = data || [];
  } catch (err) {
    rows = getLocalTimetable();
  }

  const uniq = (key, transform = (v) => v) =>
    [
      ...new Set(
        rows.map((r) => transform(r[key])).filter((v) => v !== null && v !== ""),
      ),
    ]
      .sort()
      .map(String);

  return {
    branches: uniq("branch", (v) => String(v ?? "").toUpperCase()),
    sections: uniq("section", (v) => String(v ?? "").toUpperCase()),
    years: uniq("year", toNum),
    semesters: uniq("semester", toNum),
    days: uniq("day").sort((a, b) => (DAY_ORDER[a] ?? 99) - (DAY_ORDER[b] ?? 99)),
    maxPeriod: rows.reduce(
      (max, r) => Math.max(max, toNum(r.period_number) || 0),
      0,
    ),
  };
}

/** Admin listing. `filters` values of null/"" are ignored. */
export async function getTimetableRows(filters = {}) {
  const applyFilters = (rows) =>
    rows.filter((row) => {
      if (filters.year && toNum(row.year) !== Number(filters.year)) return false;
      if (filters.branch && String(row.branch).toUpperCase() !== String(filters.branch).toUpperCase())
        return false;
      if (filters.section && String(row.section).toUpperCase() !== String(filters.section).toUpperCase())
        return false;
      if (filters.semester && toNum(row.semester) !== Number(filters.semester))
        return false;
      if (filters.day && row.day !== filters.day) return false;
      return true;
    });

  try {
    let query = supabase.from("timetable").select("*");
    if (filters.year) query = query.eq("year", Number(filters.year));
    if (filters.branch) query = query.eq("branch", String(filters.branch).toUpperCase());
    if (filters.section) query = query.eq("section", String(filters.section).toUpperCase());
    if (filters.semester) query = query.eq("semester", Number(filters.semester));
    if (filters.day) query = query.eq("day", filters.day);

    const { data, error } = await query;
    if (error) throw error;
    return sortRows(applyFilters(data || []));
  } catch (err) {
    console.warn("Timetable admin read failed, using local cache:", err.message);
    return sortRows(applyFilters(getLocalTimetable()));
  }
}

// ============================================ //
// ADMIN WRITE                                 //
// ============================================ //

function serializeEntry(entry) {
  return {
    year: Number(entry.year),
    branch: String(entry.branch || "").trim().toUpperCase(),
    section: String(entry.section || "").trim().toUpperCase(),
    semester: Number(entry.semester),
    day: entry.day,
    period_number: Number(entry.period_number),
    start_time: toHHMM(entry.start_time),
    end_time: toHHMM(entry.end_time),
    subject: String(entry.subject || "").trim(),
    faculty: String(entry.faculty || "").trim(),
    room: String(entry.room || "").trim(),
    subject_code: String(entry.subject_code || "").trim() || null,
  };
}

export async function addTimetableEntry(entry) {
  const payload = serializeEntry(entry);

  try {
    const { data, error } = await supabase
      .from("timetable")
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    saveLocalTimetable([...getLocalTimetable(), data]);
    return data;
  } catch (err) {
    console.warn("Timetable insert failed, using local cache:", err.message);
    const local = getLocalTimetable();
    const row = {
      ...payload,
      id: local.length > 0 ? Math.max(...local.map((r) => Number(r.id) || 0)) + 1 : 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    saveLocalTimetable([...local, row]);
    return row;
  }
}

export async function updateTimetableEntry(id, entry) {
  const payload = serializeEntry(entry);

  try {
    const { data, error } = await supabase
      .from("timetable")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    saveLocalTimetable(getLocalTimetable().map((r) => (r.id === id ? data : r)));
    return data;
  } catch (err) {
    console.warn("Timetable update failed, using local cache:", err.message);
    let updated = null;
    const next = getLocalTimetable().map((r) => {
      if (r.id !== id) return r;
      updated = { ...r, ...payload, updated_at: new Date().toISOString() };
      return updated;
    });
    saveLocalTimetable(next);
    return updated;
  }
}

export async function deleteTimetableEntry(id) {
  try {
    const { error } = await supabase.from("timetable").delete().eq("id", id);
    if (error) throw error;
  } catch (err) {
    console.warn("Timetable delete failed, also removing local copy:", err.message);
  }
  saveLocalTimetable(getLocalTimetable().filter((r) => r.id !== id));
  return true;
}

// ============================================ //
// REALTIME                                    //
// ============================================ //

/**
 * Subscribes to timetable changes so students see admin edits live.
 * RLS applies to the realtime payload too, so a student only ever
 * receives updates for their own class.
 * Returns an unsubscribe function.
 */
export function subscribeToTimetable(onChange) {
  const channel = supabase
    .channel(`timetable:${Math.random().toString(36).slice(2)}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "timetable" },
      () => onChange(),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ============================================ //
// SHIFT REQUESTS (existing feature, unchanged)  //
// ============================================ //

export function getShiftRequests() {
  try {
    const raw = localStorage.getItem(LOCAL_SHIFTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function submitShiftRequest(request) {
  const existing = getShiftRequests();
  const newRequest = {
    id: Date.now(),
    date: new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    status: "Pending",
    ...request,
  };
  const updated = [newRequest, ...existing];
  try {
    localStorage.setItem(LOCAL_SHIFTS_KEY, JSON.stringify(updated));
  } catch (e) {}
  return newRequest;
}