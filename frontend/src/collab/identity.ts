export interface UserIdentity {
  name: string;
  color: string;
}

const STORAGE_KEY = "collab_identity_v1";

const ADJECTIVES = [
  "Swift",
  "Brave",
  "Calm",
  "Clever",
  "Eager",
  "Gentle",
  "Happy",
  "Jolly",
  "Kind",
  "Lively",
  "Proud",
  "Quick",
  "Sunny",
  "Wise",
];

const ANIMALS = [
  "Fox",
  "Otter",
  "Panda",
  "Falcon",
  "Koala",
  "Badger",
  "Hawk",
  "Lynx",
  "Seal",
  "Tiger",
  "Wolf",
  "Zebra",
  "Robin",
  "Dolphin",
];

// Fixed palette of 10 readable colors
const PALETTE = [
  "#f44336", // Red
  "#e91e63", // Pink
  "#9c27b0", // Purple
  "#3f51b5", // Indigo
  "#2196f3", // Blue
  "#009688", // Teal
  "#4caf50", // Green
  "#ff9800", // Orange
  "#795548", // Brown
  "#607d8b", // Blue Grey
];

function getRandomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function generateIdentity(): UserIdentity {
  const adj = getRandomItem(ADJECTIVES);
  const animal = getRandomItem(ANIMALS);
  const color = getRandomItem(PALETTE);
  return {
    name: `${adj} ${animal}`,
    color,
  };
}

export function getOrCreateIdentity(): UserIdentity {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as UserIdentity;
      if (parsed && typeof parsed.name === "string" && typeof parsed.color === "string") {
        return parsed;
      }
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }

  const identity = generateIdentity();
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  } catch {
    // Ignore storage quota/security errors
  }

  return identity;
}
