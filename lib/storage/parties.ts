import type { OpenItem, Party } from "@/types";
import { demoParties } from "@/data/demo-parties";
import { companyKey } from "./accounting";

const PARTIES = "accounting-parties", ITEMS = "party-open-items";

export function loadParties(): Party[] {
  if (typeof window === "undefined") return [];
  try {
    const value = localStorage.getItem(companyKey(PARTIES));
    if (!value) return demoParties.map((party) => ({ ...party }));
    const saved = JSON.parse(value) as Party[];
    return saved.length ? saved : demoParties.map((party) => ({ ...party }));
  } catch { return demoParties.map((party) => ({ ...party })); }
}

export function saveParties(items: Party[]) { localStorage.setItem(companyKey(PARTIES), JSON.stringify(items)); }
export function loadOpenItems(): OpenItem[] { if (typeof window === "undefined") return []; try { return JSON.parse(localStorage.getItem(companyKey(ITEMS)) || "[]") as OpenItem[]; } catch { return []; } }
export function saveOpenItems(items: OpenItem[]) { localStorage.setItem(companyKey(ITEMS), JSON.stringify(items)); }
