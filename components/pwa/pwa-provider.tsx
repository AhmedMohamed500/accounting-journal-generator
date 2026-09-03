"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { RefreshCw, WifiOff } from "lucide-react";
import { detectIos, detectStandalone, FINORA_PWA_VERSION } from "@/lib/pwa";

interface InstallPromptEvent extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }>; }
interface PwaContextValue { installable: boolean; installed: boolean; ios: boolean; online: boolean; version: string; install(): Promise<boolean>; }
const PwaContext = createContext<PwaContextValue>({ installable: false, installed: false, ios: false, online: true, version: FINORA_PWA_VERSION, install: async () => false });

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [prompt, setPrompt] = useState<InstallPromptEvent>();
  const [installed, setInstalled] = useState(false), [ios, setIos] = useState(false), [online, setOnline] = useState(true), [update, setUpdate] = useState<ServiceWorkerRegistration>();
  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const syncMode = () => setInstalled(detectStandalone(media.matches, Boolean((navigator as Navigator & { standalone?: boolean }).standalone)));
    const syncOnline = () => setOnline(navigator.onLine);
    const beforeInstall = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPromptEvent); };
    syncMode(); syncOnline(); setIos(detectIos(navigator.userAgent));
    window.addEventListener("beforeinstallprompt", beforeInstall); window.addEventListener("appinstalled", syncMode); window.addEventListener("online", syncOnline); window.addEventListener("offline", syncOnline); media.addEventListener("change", syncMode);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js", { scope: "/" }).then((registration) => {
      registration.update();
      registration.addEventListener("updatefound", () => { const worker = registration.installing; worker?.addEventListener("statechange", () => { if (worker.state === "installed" && navigator.serviceWorker.controller) setUpdate(registration); }); });
    }).catch(() => undefined);
    const reload = () => location.reload(); navigator.serviceWorker?.addEventListener("controllerchange", reload);
    return () => { window.removeEventListener("beforeinstallprompt", beforeInstall); window.removeEventListener("appinstalled", syncMode); window.removeEventListener("online", syncOnline); window.removeEventListener("offline", syncOnline); media.removeEventListener("change", syncMode); navigator.serviceWorker?.removeEventListener("controllerchange", reload); };
  }, []);
  const value = useMemo<PwaContextValue>(() => ({ installable: Boolean(prompt), installed, ios, online, version: FINORA_PWA_VERSION, install: async () => { if (!prompt) return false; await prompt.prompt(); const result = await prompt.userChoice; if (result.outcome === "accepted") setPrompt(undefined); return result.outcome === "accepted"; } }), [prompt, installed, ios, online]);
  return <PwaContext.Provider value={value}>{children}{!online && <div className="pwa-connection"><WifiOff size={15}/><span>Local mode · وضع محلي</span></div>}{update && <div className="pwa-update"><span>يتوفر تحديث جديد لـ FINORA · A FINORA update is ready</span><button onClick={() => update.waiting?.postMessage({ type: "SKIP_WAITING" })}><RefreshCw size={15}/>تحديث الآن</button></div>}</PwaContext.Provider>;
}

export const usePwa = () => useContext(PwaContext);
