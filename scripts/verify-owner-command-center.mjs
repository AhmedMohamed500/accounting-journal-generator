import fs from "node:fs/promises";
import path from "node:path";

const base = process.argv[2] || "http://127.0.0.1:3110";
const target = await fetch("http://127.0.0.1:9224/json/new?about:blank", { method: "PUT" }).then((response) => response.json());
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
let id = 0;
const pending = new Map();
const runtimeErrors = [];
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.method === "Runtime.exceptionThrown") runtimeErrors.push(message.params.exceptionDetails.text);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id); pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message)); else resolve(message.result);
});
const call = (method, params = {}) => new Promise((resolve, reject) => { const requestId = ++id; pending.set(requestId, { resolve, reject }); socket.send(JSON.stringify({ id: requestId, method, params })); });
const evaluate = async (expression) => (await call("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result.value;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await call("Runtime.enable"); await call("Page.enable");
await call("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await call("Page.navigate", { url: `${base}/ar/service-point/owner-dashboard` }); await wait(1800);
const hasStart = await evaluate(`Boolean([...document.querySelectorAll('button')].find(x=>x.textContent.includes('إنشاء Demo')))`);
if (hasStart) { await evaluate(`[...document.querySelectorAll('button')].find(x=>x.textContent.includes('إنشاء Demo')).click()`); await wait(1200); }
await evaluate(`localStorage.setItem('finora-owner-dashboard-mode','detailed'); location.reload()`); await wait(1500);

const viewports = [[320, 760], [390, 844], [768, 1024], [1024, 900], [1440, 1000]];
const checks = [];
for (const [width, height] of viewports) {
  await call("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 768 }); await wait(250);
  checks.push(await evaluate(`({width:${width},overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,hasBrief:document.body.innerText.includes('SMART DAILY BRIEF'),hasFawry:document.body.innerText.includes('فوري'),hasCashier:document.body.innerText.includes('أداء الكاشير'),hasPending:document.body.innerText.includes('عمليات معلقة منذ وقت طويل')})`));
}
await call("Emulation.setEmulatedMedia", { media: "print" });
const printReady = await evaluate(`getComputedStyle(document.querySelector('.owner-daily-print')).display==='block' && document.querySelector('.owner-daily-print').innerText.includes('تقرير صاحب المحل اليومي')`);
await call("Emulation.setEmulatedMedia", { media: "screen" });
await call("Page.navigate", { url: `${base}/en/service-point/owner-dashboard` }); await wait(1200);
const englishReady = await evaluate(`({hasTitle:document.body.innerText.includes('Owner Command Center'),hasBrief:document.body.innerText.includes('FINORA summary for today'),hasCashier:document.body.innerText.includes('Cashier performance'),overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth})`);
await call("Page.navigate", { url: `${base}/ar/service-point/owner-dashboard` }); await wait(900);
await call("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }); await wait(200);
const screenshot = await call("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
const screenshotPath = path.join(process.env.TEMP || ".", "finora-owner-command-center.png"); await fs.writeFile(screenshotPath, Buffer.from(screenshot.data, "base64"));
console.log(JSON.stringify({ checks, printReady, englishReady, runtimeErrors, screenshotPath }, null, 2));
socket.close();
