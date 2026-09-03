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
  if (message.method === "Runtime.exceptionThrown") runtimeErrors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id); pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message)); else resolve(message.result);
});
const call = (method, params = {}) => new Promise((resolve, reject) => { const requestId = ++id; pending.set(requestId, { resolve, reject }); socket.send(JSON.stringify({ id: requestId, method, params })); });
const evaluate = async (expression) => (await call("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result.value;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const navigate = async (url, delay = 1000) => { await call("Page.navigate", { url }); await wait(delay); };
const click = async (selector) => { const clicked = await evaluate(`Boolean((()=>{const el=document.querySelector(${JSON.stringify(selector)});if(el)el.click();return el})())`); if (!clicked) throw new Error(`Missing ${selector}`); await wait(350); };

await call("Runtime.enable"); await call("Page.enable"); await call("Network.enable");
await call("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await navigate(`${base}/ar/service-point/demo`, 1500);
await evaluate(`Object.keys(localStorage).filter(k=>k.includes('finora-service-point-sales-demo-progress')).forEach(k=>localStorage.removeItem(k));localStorage.removeItem('finora-demo-install-cta-seen');location.reload()`); await wait(1100);

const landing = await evaluate(`({title:document.body.innerText.includes('جرّب FINORA بنفسك'),qr:Boolean(document.querySelector('img[src*="finora-mobile-demo-qr"]')),manifest:document.querySelector('link[rel="manifest"]')?.getAttribute('href'),dir:document.querySelector('.demo-landing')?.dir})`);
await click(".demo-primary");
const steps = [];
for (let current = 1; current <= 3; current += 1) {
  steps.push(await evaluate(`({step:${current},label:document.querySelector('.demo-task-card>span')?.textContent,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,profit8:${current===2}?/صافي الربح[\\s\\S]{0,80}٨/.test(document.body.innerText):true})`));
  await click(".demo-action");
}
await evaluate(`location.reload()`); await wait(1000);
const resume = await evaluate(`document.body.innerText.includes('تكمل التجربة من حيث توقفت؟') && document.body.innerText.includes('الخطوة 4 من 7')`);
await evaluate(`[...document.querySelectorAll('button')].find(x=>x.textContent.includes('متابعة'))?.click()`); await wait(300);
for (let current = 4; current <= 7; current += 1) {
  steps.push(await evaluate(`({step:${current},label:document.querySelector('.demo-task-card>span')?.textContent,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,pendingZero:${current===4}?document.body.innerText.includes('أثر الخزنة الآن'):true,lowBalance:${current===5}?document.body.innerText.includes('فوري'):true})`));
  await click(".demo-action");
}
const finale = await evaluate(`({complete:document.body.innerText.includes('شفت FINORA بيعمل إيه في يوم شغل؟'),variance:document.body.innerText.includes('فرق الخزنة'),summary:document.body.innerText.includes('ملخص FINORA لليوم'),plans:Boolean([...document.querySelectorAll('a')].find(x=>x.textContent.includes('شاهد الباقات'))),overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth})`);

const viewports = [];
for (const [width, height] of [[320,760],[360,800],[390,844],[430,900],[768,1024],[820,1000],[1024,900],[1440,1000]]) {
  await call("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 768 }); await wait(120);
  viewports.push(await evaluate(`({width:${width},overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth})`));
}

await navigate(`${base}/en/service-point/demo`); await evaluate(`Object.keys(localStorage).filter(k=>k.includes('finora-service-point-sales-demo-progress')).forEach(k=>localStorage.removeItem(k));location.reload()`); await wait(900);
const english = await evaluate(`({title:document.body.innerText.includes('Try FINORA yourself'),dir:document.querySelector('.demo-landing')?.dir,installCopy:document.body.innerText.includes('Cloud sync is not enabled'),overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth})`);

const pwa = await evaluate(`(async()=>{const manifest=await fetch('/manifest.webmanifest').then(r=>r.json());const icon=await fetch('/finora-icon-192.png');const registration=await navigator.serviceWorker.ready;return {name:manifest.name,display:manifest.display,startUrl:manifest.start_url,icons:manifest.icons.length,iconType:icon.headers.get('content-type'),worker:Boolean(registration.active)}})()`);
await navigate(`${base}/ar/service-point/demo`); await wait(700); await evaluate(`navigator.serviceWorker.ready.then(()=>location.reload())`); await wait(900);
await call("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0, connectionType: "none" });
await wait(250);
const connectionUi = await evaluate(`document.body.innerText.includes('Local mode · وضع محلي')`);
await navigate(`${base}/ar/service-point/demo`, 900);
const offline = await evaluate(`({served:document.body.innerText.includes('FINORA'),connectionUi:${connectionUi},browserError:document.body.innerText.includes('ERR_INTERNET_DISCONNECTED')})`);
await call("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1, connectionType: "wifi" });

await call("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }); await navigate(`${base}/ar/service-point/demo`, 700);
const screenshot = await call("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
const screenshotPath = path.join(process.env.TEMP || ".", "finora-pwa-sales-demo.png"); await fs.writeFile(screenshotPath, Buffer.from(screenshot.data, "base64"));
console.log(JSON.stringify({ landing, steps, resume, finale, viewports, english, pwa, offline, runtimeErrors, screenshotPath }, null, 2));
socket.close();
