const LOCAL_TIMETABLE_KEY = "campusguide_timetable_data";
const LOCAL_SHIFTS_KEY = "campusguide_shifts_data";

export const STUDENT_SCHEDULE = [
  { id: 1, time: "09:00 - 10:00", subject: "Data Structures & Algorithm", code: "CS501", room: "204", floor: 2, faculty: "Prof. Kishor Kumar", status: "active", dot: "green" },
  { id: 2, time: "10:15 - 11:15", subject: "Operating Systems", code: "CS502", room: "301", floor: 3, faculty: "Prof. Ashwini C K", status: "upcoming", dot: "blue" },
  { id: 3, time: "12:00 - 01:00", subject: "Database Management Systems", code: "CS503", room: "203", floor: 2, faculty: "Dr. Sneha", status: "upcoming", dot: "purple" },
  { id: 4, time: "02:00 - 03:00", subject: "Computer Networks", code: "CS504", room: "201", floor: 2, faculty: "Prof. Ramesh", status: "upcoming", dot: "blue" },
];

export const FACULTY_SCHEDULE = [
  { id: 101, time: "09:00 - 10:00", subject: "DBMS", section: "5th Sem - B", room: "204", floor: 2, dot: "green" },
  { id: 102, time: "11:00 - 12:00", subject: "OS", section: "5th Sem - A", room: "301", floor: 3, dot: "blue" },
  { id: 103, time: "02:00 - 03:00", subject: "CN", section: "5th Sem - B", room: "201", floor: 2, dot: "purple" },
];

export function getStudentClasses() {
  return STUDENT_SCHEDULE;
}

export function getFacultyClasses() {
  return FACULTY_SCHEDULE;
}

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
    date: new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
    status: "Pending",
    ...request,
  };
  const updated = [newRequest, ...existing];
  try {
    localStorage.setItem(LOCAL_SHIFTS_KEY, JSON.stringify(updated));
  } catch (e) {}
  return newRequest;
}
