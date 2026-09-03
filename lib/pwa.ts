export const FINORA_PWA_VERSION = "2026.09.04";

export function detectStandalone(matchesDisplayMode: boolean, navigatorStandalone = false) {
  return matchesDisplayMode || navigatorStandalone;
}

export function detectIos(userAgent: string) {
  return /iphone|ipad|ipod/i.test(userAgent);
}

export function localStorageSizeKb(storage: Pick<Storage, "length" | "key" | "getItem">) {
  let characters = 0;
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index) || "";
    characters += key.length + (storage.getItem(key)?.length || 0);
  }
  return Math.round((characters * 2 / 1024) * 100) / 100;
}

export function pwaInstallGuidance(input: { standalone: boolean; installPromptAvailable: boolean; ios: boolean }) {
  if (input.standalone) return "installed" as const;
  if (input.installPromptAvailable) return "prompt" as const;
  if (input.ios) return "ios" as const;
  return "browser" as const;
}
