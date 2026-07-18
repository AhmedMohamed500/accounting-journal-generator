"use client";
import { useEffect } from "react";
import { englishForArabic } from "@/lib/i18n/accounting-glossary";

const ignored = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "INPUT", "TEXTAREA", "SVG", "PATH"]);

export function BilingualAccountingLabels({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;
    const root = document.querySelector<HTMLElement>("[data-bilingual-accounting-root]"); if (!root) return;
    const translate = (element: Element) => {
      if (ignored.has(element.tagName) || element.closest("[data-no-bilingual]")) return;
      const directText = [...element.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE).map((node) => node.textContent || "").join(" ").replace(/\s+/g, " ").trim();
      const english = directText ? englishForArabic(directText) : undefined;
      if (element.tagName === "OPTION") { const option = element as HTMLOptionElement; if (english && !option.label.endsWith(`· ${english}`)) option.label = `${directText} · ${english}`; return; }
      if (english) element.setAttribute("data-en-label", english); else element.removeAttribute("data-en-label");
    };
    const scan = (node: Node) => { if (node instanceof Element) { translate(node); node.querySelectorAll("*").forEach(translate); } else if (node.parentElement) translate(node.parentElement); };
    scan(root);
    const observer = new MutationObserver((records) => records.forEach((record) => { if (record.type === "characterData") scan(record.target); record.addedNodes.forEach(scan); }));
    observer.observe(root, { childList: true, characterData: true, subtree: true });
    return () => observer.disconnect();
  }, [enabled]);
  return null;
}
