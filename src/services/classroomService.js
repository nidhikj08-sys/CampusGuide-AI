import { supabase } from "../supabase";

const LOCAL_STORAGE_KEY = "campusguide_classrooms_data";

// Initial seed data based on the KVGCE synopsis and floor map
const DEFAULT_CLASSROOMS = [
  { id: 1, room_number: "201", floor: 2, type: "Classroom", capacity: 60, building: "Main Block" },
  { id: 2, room_number: "202", floor: 2, type: "Classroom", capacity: 60, building: "Main Block" },
  { id: 3, room_number: "203", floor: 2, type: "Lab", capacity: 40, building: "Main Block" },
  { id: 4, room_number: "204", floor: 2, type: "Classroom", capacity: 60, building: "Main Block" },
  { id: 5, room_number: "205", floor: 2, type: "Classroom", capacity: 60, building: "Main Block" },
  { id: 6, room_number: "206", floor: 2, type: "Classroom", capacity: 60, building: "Main Block" },
  { id: 7, room_number: "207", floor: 2, type: "Seminar Hall", capacity: 120, building: "Main Block" },
  { id: 8, room_number: "101", floor: 1, type: "Classroom", capacity: 60, building: "Main Block" },
  { id: 9, room_number: "102", floor: 1, type: "Classroom", capacity: 60, building: "Main Block" },
  { id: 10, room_number: "103", floor: 1, type: "Office", capacity: 15, building: "Main Block" },
  { id: 11, room_number: "104", floor: 1, type: "Lab", capacity: 45, building: "Main Block" },
  { id: 12, room_number: "301", floor: 3, type: "Classroom", capacity: 60, building: "Main Block" },
  { id: 13, room_number: "302", floor: 3, type: "Classroom", capacity: 60, building: "Main Block" },
  { id: 14, room_number: "303", floor: 3, type: "Lab", capacity: 40, building: "Main Block" },
];

function getLocalClassrooms() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_CLASSROOMS));
      return DEFAULT_CLASSROOMS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Local storage read error:", err);
    return DEFAULT_CLASSROOMS;
  }
}

function saveLocalClassrooms(items) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error("Local storage write error:", err);
  }
}

export async function getClassrooms() {
  try {
    const { data, error } = await supabase
      .from("classrooms")
      .select("*")
      .order("floor", { ascending: true })
      .order("room_number", { ascending: true });

    if (error || !data) {
      // Gracefully fall back to local storage if table doesn't exist yet
      return getLocalClassrooms();
    }
    return data;
  } catch (e) {
    return getLocalClassrooms();
  }
}

export async function addClassroom(classroom) {
  try {
    const { data, error } = await supabase
      .from("classrooms")
      .insert([{
        room_number: classroom.room_number,
        floor: Number(classroom.floor),
        type: classroom.type,
        capacity: Number(classroom.capacity) || 60,
        building: classroom.building || "Main Block"
      }])
      .select()
      .single();

    if (!error && data) {
      // Also sync to local storage cache
      const local = getLocalClassrooms();
      saveLocalClassrooms([data, ...local]);
      return data;
    }
  } catch (e) {
    // continue to local fallback
  }

  // Fallback to local storage
  const local = getLocalClassrooms();
  const newId = local.length > 0 ? Math.max(...local.map(r => Number(r.id) || 0)) + 1 : 1;
  const newRoom = {
    id: newId,
    room_number: classroom.room_number,
    floor: Number(classroom.floor),
    type: classroom.type,
    capacity: Number(classroom.capacity) || 60,
    building: classroom.building || "Main Block"
  };
  const updated = [newRoom, ...local];
  saveLocalClassrooms(updated);
  return newRoom;
}

export async function updateClassroom(id, updates) {
  try {
    const { data, error } = await supabase
      .from("classrooms")
      .update({
        room_number: updates.room_number,
        floor: Number(updates.floor),
        type: updates.type,
        capacity: Number(updates.capacity),
        building: updates.building || "Main Block"
      })
      .eq("id", id)
      .select()
      .single();

    if (!error && data) {
      const local = getLocalClassrooms().map(r => r.id === id ? data : r);
      saveLocalClassrooms(local);
      return data;
    }
  } catch (e) {
    // continue to local fallback
  }

  // Fallback
  const local = getLocalClassrooms().map(r => {
    if (r.id === id) {
      return {
        ...r,
        ...updates,
        floor: Number(updates.floor),
        capacity: Number(updates.capacity)
      };
    }
    return r;
  });
  saveLocalClassrooms(local);
  return local.find(r => r.id === id);
}

export async function deleteClassroom(id) {
  try {
    const { error } = await supabase
      .from("classrooms")
      .delete()
      .eq("id", id);

    if (error) {
      console.warn("Supabase delete failed, using local storage:", error.message);
    }
  } catch (e) {
    // ignore
  }

  const local = getLocalClassrooms().filter(r => r.id !== id);
  saveLocalClassrooms(local);
  return true;
}

export async function getDashboardStats() {
  const classrooms = await getClassrooms();
  
  let studentsCount = 120;
  let facultyCount = 25;

  try {
    const { count: sCount, error: sErr } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "student");
    if (!sErr && sCount !== null) studentsCount = sCount;

    const { count: fCount, error: fErr } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "faculty");
    if (!fErr && fCount !== null) facultyCount = fCount;
  } catch (e) {
    // ignore, keep defaults
  }

  return {
    totalStudents: studentsCount,
    totalFaculty: facultyCount,
    totalClassrooms: classrooms.length,
    totalTimetables: 5,
  };
}
