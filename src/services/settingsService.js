const STORAGE_KEY = "campusguide_settings";

const DEFAULTS = {
  theme: "system",
  notificationsEnabled: true,
  notificationSound: true,
  vibration: true,
  notificationCategories: {
    classroom_changes: true,
    timetable_changes: true,
    important_announcements: true,
    events: true,
    emergency: true,
  },
  navigationGuidance: true,
  voiceGuidance: true,
  distanceUnit: "meters",
  preferredRoute: "shortest",
  saveLogin: true,
  showProfileInfo: true,
  language: "en",
  textSize: "medium",
  highContrast: false,
  reduceAnimations: false,
  allowOfflineMaps: true,
  cacheTimetable: true,
  cacheBuildingMap: true,
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch (e) {
    return { ...DEFAULTS };
  }
}

function save(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {}
}

export const settings = {
  state: load(),

  get(key) {
    return this.state[key];
  },

  getAll() {
    return { ...this.state };
  },

  set(key, value) {
    this.state = { ...this.state, [key]: value };
    save(this.state);
    this.apply();
  },

  update(partial) {
    this.state = { ...this.state, ...partial };
    save(this.state);
    this.apply();
  },

  reset() {
    this.state = { ...DEFAULTS };
    save(this.state);
    this.apply();
  },

  apply() {
    const root = document.documentElement;
    const state = this.state;

    root.setAttribute("data-theme", state.theme);
    root.setAttribute("data-text-size", state.textSize);
    root.setAttribute("data-high-contrast", state.highContrast ? "true" : "false");
    root.setAttribute("data-reduce-motion", state.reduceAnimations ? "true" : "false");
    root.setAttribute("data-language", state.language);
  },
};

export function initSettings() {
  settings.apply();
}

export function getSettingsSync() {
  return settings.getAll();
}
