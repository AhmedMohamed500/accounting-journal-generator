import type { ExtractedInvoice, ExtractedInvoiceLine } from "@/types";
import { normalizeArabicNumbers } from "@/lib/parser/normalize";
import { roundCurrency } from "@/lib/accounting/calculations";

const amountToken=/-?[0-9][0-9,٬]*(?:[.٫][0-9]{1,3})?%?/g;
const numeric=(value:string)=>{
  let text=value.replace(/[%\s٬،]/g,"").replace(/٫/g,".");
  const comma=text.lastIndexOf(","),dot=text.lastIndexOf(".");
  if(comma>=0&&dot>=0){const decimal=Math.max(comma,dot);text=text.slice(0,decimal).replace(/[,.]/g,"")+"."+text.slice(decimal+1).replace(/[,.]/g,"");}
  else if(comma>=0){const decimals=text.length-comma-1,count=(text.match(/,/g)||[]).length;text=decimals===1||decimals===2?(count>1?text.slice(0,comma).replace(/,/g,"")+"."+text.slice(comma+1):text.replace(",",".")):text.replace(/,/g,"");}
  else if(dot>=0){const decimals=text.length-dot-1;if(decimals===3&&dot>0)text=text.replace(/\./g,"");}
  return Number(text)||0;
};
const clean=(value:string)=>value.replace(/^[\s:#|–—-]+|[\s:#|–—-]+$/g,"").trim();
const linesOf=(text:string)=>text.split(/\r?\n/).map(line=>line.replace(/[\t ]+/g," ").trim()).filter(Boolean);

function normalizePdfVisualArabic(raw:string){
  const lines=raw.split(/\r?\n/),asIs=lines.map(line=>line.normalize("NFKC")),reversed=lines.map((line,index)=>{
    if(!/[\uFB50-\uFDFF\uFE70-\uFEFF]/u.test(line))return asIs[index];
    const logical=[...asIs[index]].reverse().join("");
    return logical.replace(/[A-Za-z0-9٠-٩۰-۹][A-Za-z0-9٠-٩۰-۹:/+.,#_()-]*/g,token=>[...token].reverse().join(""));
  });
  const score=(values:string[])=>values.reduce((total,line)=>total+((line.match(/(?:فاتورة|تاريخ|إجمالي|اجمالي|ضريبة|المبلغ|المبيعات|البائع|المشتري|رقم|الاسم)/g)||[]).length),0);
  return(score(reversed)>score(asIs)?reversed:asIs).join("\n");
}

function amount(text:string,labels:string[]){
  const rows=linesOf(text);
  for(const label of labels)for(let index=0;index<rows.length;index++){const line=rows[index],matcher=new RegExp(label,"i"),match=matcher.exec(line);if(!match)continue;const after=line.slice(match.index+match[0].length,match.index+match[0].length+55).match(amountToken)?.find(token=>!token.endsWith("%")),afterValue=after?numeric(after):0;if(afterValue>0)return afterValue;const before=line.slice(Math.max(0,match.index-55),match.index).match(amountToken)?.filter(token=>!token.endsWith("%")).at(-1),beforeValue=before?numeric(before):0;if(beforeValue>0)return beforeValue;
    for(const nearby of [rows[index+1],rows[index-1],rows[index+2]]){if(!nearby||/[A-Za-z\u0600-\u06ff]{4,}/.test(nearby.replace(/(?:EGP|ج\.?\s?م|جنيه|ريال|دولار)/gi,"")))continue;const token=nearby.match(amountToken)?.find(value=>!value.endsWith("%"));if(token&&numeric(token)>0)return numeric(token);}
  }
  return 0;
}

function value(text:string,labels:string[]){
  const rows=linesOf(text);
  for(let index=0;index<rows.length;index++)for(const label of labels){const line=rows[index],matcher=new RegExp(label,"i"),match=matcher.exec(line);if(!match)continue;const after=clean(line.slice(match.index+match[0].length));if(after&&after.length<=120)return after;const before=clean(line.slice(0,match.index));if(before&&before.length<=120)return before;for(const nearby of [rows[index+1],rows[index-1]]){const candidate=clean(nearby||"");if(candidate&&candidate.length<=120&&!labels.some(item=>new RegExp(item,"i").test(candidate)))return candidate;}}
  return"";
}

function fallbackTotal(text:string,hasInvoiceLabel:boolean){
  if(!hasInvoiceLabel)return 0;
  const rows=linesOf(text),candidates:number[]=[];
  for(const line of rows.slice(Math.max(0,Math.floor(rows.length*.35)))){
    if (/(tax number|registration|الرقم الضريبي|السجل التجاري|phone|هاتف|تليفون|invoice no|رقم الفاتورة|date|تاريخ)/i.test(line)) continue;
    const hasMoneyHint=/(EGP|ج\.?\s?م|جنيه|ريال|دولار|amount|total|إجمالي|المبلغ|الصافي|ضريبة)/i.test(line);
    for(const token of line.match(amountToken)||[]){if(token.endsWith("%"))continue;const plain=token.replace(/[^\d]/g,"");if(plain.length>10)continue;const parsed=numeric(token);if(parsed>0&&(hasMoneyHint||/[,.]/.test(token)))candidates.push(parsed);}
  }
  return candidates.length?Math.max(...candidates):0;
}

function isoDate(raw:string){const parts=raw.trim().split(/[\/-]/).map(Number);if(parts.length!==3||parts.some(part=>!Number.isFinite(part)))return"";if(parts[0]>1900){const[,month,day]=parts;if(month<1||month>12||day<1||day>31)return"";return`${parts[0]}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;}let[day,month]=parts;const year=parts[2];if(day<=12&&month>12)[day,month]=[month,day];if(month<1||month>12||day<1||day>31)return"";return`${year<100?2000+year:year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;}

function inferSupplier(text:string){
  const ignored=/(invoice|فاتورة|tax|ضريب|customer|العميل|date|تاريخ|total|إجمالي|address|العنوان|phone|هاتف)/i;
  return linesOf(text).slice(0,15).find(line=>!ignored.test(line)&&/(شركة|مؤسسة|مكتب|مصنع|مركز|store|company|co\.|ltd|supplies|trading|services)/i.test(line)&&line.replace(/[^\p{L}]/gu,"").length>=5)?.slice(0,120)||"";
}

function lineCandidate(tokens:string[],offset:number,fallbackRate:number){
  if(tokens.length-offset<3)return;const qty=numeric(tokens[offset]),price=numeric(tokens[offset+1]);if(!(qty>0&&qty<=1_000_000&&price>0))return;const base=roundCurrency(qty*price),tail=tokens.slice(offset+2),rateToken=tail.find(token=>token.endsWith("%")),explicitRate=rateToken?numeric(rateToken):0,amounts=tail.filter(token=>!token.endsWith("%")).map(numeric).filter(value=>value>=0),last=amounts.at(-1)||0;if(!last)return;
  const possibleNets=[base,...amounts.slice(0,-1)],net=possibleNets.reduce((best,value)=>Math.abs(value-base)<Math.abs(best-base)?value:best,base),total=last,impliedVat=Math.max(0,roundCurrency(total-net)),rate=explicitRate||(net>0&&impliedVat/net<=.35?roundCurrency(impliedVat/net*100):fallbackRate),expectedWithTax=roundCurrency(net+net*rate/100),matchesTax=Math.abs(total-expectedWithTax)<=Math.max(.1,expectedWithTax*.035),matchesNet=Math.abs(total-net)<=Math.max(.1,net*.035);if(!matchesTax&&!matchesNet)return;const vat=matchesNet?0:roundCurrency(total-net),discount=Math.max(0,roundCurrency(base-net));return{quantity:qty,unitPrice:price,discount,vatRate:net?roundCurrency(vat/net*100):rate,net,vat,total,score:Math.min(Math.abs(total-expectedWithTax),Math.abs(total-net))};
}

function lineItems(text:string,fallbackRate:number):ExtractedInvoiceLine[]{
  const ignore=/(subtotal|grand total|invoice total|invoice(?: no| number)?|due date|^date\b|net amount|tax amount|vat amount|الإجمالي|الصافي|الضريبة|رقم الفاتورة|تاريخ|supplier|vendor|المورد|صفحة|page)/i,results:ExtractedInvoiceLine[]=[],seen=new Set<string>();
  for(const source of linesOf(text)){if(ignore.test(source))continue;const tokens=(source.match(amountToken)||[]).map(token=>token.trim()).filter(Boolean);if(tokens.length<3||tokens.some(token=>/^20\d{2}$/.test(token)))continue;const description=clean(source.replace(amountToken," ").replace(/\s+/g," ").replace(/^[.)\-\d\s]+/,""));if(description.length<2||description.length>140)continue;const reversed=[...tokens].reverse(),candidates=[lineCandidate(tokens,0,fallbackRate),lineCandidate(tokens,1,fallbackRate),lineCandidate(reversed,0,fallbackRate),lineCandidate(reversed,1,fallbackRate)].filter(Boolean) as NonNullable<ReturnType<typeof lineCandidate>>[];if(!candidates.length)continue;const candidate=candidates.sort((a,b)=>a.score-b.score)[0],key=`${description.replace(/\s+/g," ").toLocaleLowerCase("ar-EG")}|${candidate.quantity}|${candidate.unitPrice}|${candidate.total}`;if(seen.has(key))continue;seen.add(key);results.push({id:`line-${results.length+1}`,description,quantity:candidate.quantity,unitPrice:candidate.unitPrice,discount:candidate.discount,vatRate:candidate.vatRate,net:candidate.net,vat:candidate.vat,total:candidate.total});if(results.length>=200)break;
  }
  return results;
}

function invoiceNumberFrom(text:string){const raw=value(text,["invoice(?: no| number| #)?","رقم الفاتورة","فاتورة رقم","الرقم الإلكتروني","الرقم الالكتروني"]),token=raw.match(/[A-Z0-9][A-Z0-9\/_-]{1,64}/i)?.[0];return token||"";}

export function parseInvoiceText(raw:string):ExtractedInvoice{
  const text=normalizeArabicNumbers(normalizePdfVisualArabic(raw)).normalize("NFKC").replace(/\u00a0/g," ").replace(/[ \t]+/g," ").replace(/(?:إجمالى|اجمالي)/g,"إجمالي").replace(/الضريبه/g,"الضريبة").replace(/ضريبه/g,"ضريبة").replace(/القيمه/g,"القيمة").replace(/المضافه/g,"المضافة").replace(/االسم/g,"الاسم").replace(/االصدار/g,"الإصدار").replace(/فاتوره/g,"فاتورة"),hasInvoiceLabel=/(?:tax invoice|invoice|فاتورة)/i.test(text);
  const invoiceNumber=invoiceNumberFrom(text),taxNumber=value(text,["tax(?: registration)?(?: no| number)?","VAT No","الرقم الضريبي","رقم التسجيل الضريبي","رقم التسجيل"]).replace(/[^0-9A-Za-z-]/g,"").slice(0,30),supplier=(value(text,["supplier name","supplier","vendor","اسم المورد","المورد","البائع"])||inferSupplier(text)).replace(/^(?:الاسم|اسم البائع)\s*[:#-]?\s*/i,"");
  const explicitDate=text.match(/(?:invoice date|تاريخ الفاتورة|تاريخ الإصدار|تاريخ الاصدار)\s*[:#-]?\s*(\d{1,4}[\/-]\d{1,2}[\/-]\d{1,4})/i),genericDate=hasInvoiceLabel?text.match(/(?:^|\n)(?:date|التاريخ)\s*[:#-]?\s*(\d{1,4}[\/-]\d{1,2}[\/-]\d{1,4})/im)||text.match(/\b(\d{4}-\d{2}-\d{2})\b/):null,dueMatch=text.match(/(?:due date|تاريخ الاستحقاق)\s*[:#-]?\s*(\d{1,4}[\/-]\d{1,2}[\/-]\d{1,4})/i),dateFallback=value(text,["invoice date","تاريخ الفاتورة","تاريخ الإصدار","تاريخ الاصدار","^date$","^التاريخ$"]).match(/\d{1,4}[\/-]\d{1,2}[\/-]\d{1,4}/)?.[0]||"",dueFallback=value(text,["due date","تاريخ الاستحقاق"]).match(/\d{1,4}[\/-]\d{1,2}[\/-]\d{1,4}/)?.[0]||"",date=isoDate((explicitDate||genericDate)?.[1]||dateFallback),dueDate=isoDate(dueMatch?.[1]||dueFallback);
  let total=amount(text,["grand total","total amount","invoice total","amount due","total due","الإجمالي شامل الضريبة","الإجمالي بعد الضريبة","إجمالي الفاتورة","إجمالي المستحق","المبلغ المستحق","إجمالي المبلغ","الإجمالي"]),vat=amount(text,["VAT amount","tax amount","total VAT","VAT total","قيمة ضريبة القيمة المضافة","إجمالي ضريبة القيمة المضافة","ضريبة القيمة المضافة","إجمالي الضريبة","قيمة الضريبة","الضريبة"]),withholdingTax=amount(text,["withholding tax","tax withheld","withheld amount","الخصم تحت حساب الضريبة","خصم تحت حساب الضريبة","ضريبة الخصم والإضافة","ضريبة الخصم"]),discount=amount(text,["discount total","total discount","إجمالي الخصم","خصم الصنف","خصم الفاتورة"]),subtotal=amount(text,["subtotal","gross amount","total before discount","الإجمالي قبل الخصم","الإجمالي الفرعي","إجمالي المبيعات","المجموع"]),net=amount(text,["net amount","amount before tax","taxable amount","net total","الصافي","الإجمالي قبل الضريبة","المبلغ قبل الضريبة","الخاضع للضريبة","إجمالي المبيعات","قبل الضريبة"]);
  if(!total)total=fallbackTotal(text,hasInvoiceLabel);
  if(!net&&subtotal)net=roundCurrency(Math.max(0,subtotal-discount));if(!net&&total&&vat)net=roundCurrency(total-vat+withholdingTax);if(!vat&&total&&net&&total+withholdingTax>=net)vat=roundCurrency(total+withholdingTax-net);if(!total&&net)total=roundCurrency(net+vat-withholdingTax);if(!subtotal&&net)subtotal=roundCurrency(net+discount);
  const rateMatch=text.match(/(?:VAT|ضريبة القيمة المضافة|الضريبة)\s*(?:rate|نسبة)?\s*[:#-]?\s*(\d+(?:\.\d+)?)\s*%/i);let vatRate=rateMatch?Number(rateMatch[1]):net&&vat?roundCurrency(vat/net*100):0,withholdingRate=net&&withholdingTax?roundCurrency(withholdingTax/net*100):0;
  if(!net&&total&&vatRate>0){net=roundCurrency(total/(1+vatRate/100));vat=roundCurrency(total-net);subtotal=net;}
  else if(!net&&total&&!/(VAT|ضريبة|tax)/i.test(text)){net=total;subtotal=total;}
  let lines=lineItems(text,vatRate);
  if(lines.length){
    const lineNet=roundCurrency(lines.reduce((sum,line)=>sum+line.net,0)),lineVat=roundCurrency(lines.reduce((sum,line)=>sum+line.vat,0)),lineTotal=roundCurrency(lines.reduce((sum,line)=>sum+line.total,0));
    if(!net)net=lineNet;if(!vat)vat=lineVat;if(!total)total=roundCurrency(lineTotal-withholdingTax);if(!subtotal)subtotal=roundCurrency(net+discount);if(!vatRate&&net)vatRate=roundCurrency(vat/net*100);if(!withholdingRate&&net)withholdingRate=roundCurrency(withholdingTax/net*100);
    if(vat>0&&lineVat===0&&lineNet>0&&Math.abs(lineNet-net)<=Math.max(.05,net*.01)){
      let allocated=0;
      lines=lines.map((line,index)=>{const lineTax=index===lines.length-1?roundCurrency(vat-allocated):roundCurrency(vat*line.net/lineNet);allocated=roundCurrency(allocated+lineTax);return{...line,vatRate:line.net?roundCurrency(lineTax/line.net*100):vatRate,vat:lineTax,total:roundCurrency(line.net+lineTax)};});
    }
  }
  const currency=/\bUSD\b|دولار/i.test(text)?"USD":/\bSAR\b|ريال/i.test(text)?"SAR":/\bAED\b|درهم/i.test(text)?"AED":/\bEUR\b|يورو/i.test(text)?"EUR":"EGP",warnings:string[]=[];
  if(!supplier)warnings.push("supplier");if(!invoiceNumber)warnings.push("invoice-number");if(!date)warnings.push("date");if(!total)warnings.push("total");if(!lines.length)warnings.push("line-items");if(total&&net&&Math.abs(total-(net+vat-withholdingTax))>Math.max(.05,total*.005))warnings.push("totals-do-not-match");
  const identity=Boolean(invoiceNumber||supplier||hasInvoiceLabel),financials=Boolean(total>0||net>0||vat>0||lines.length);
  if(!identity){warnings.push("possibly-not-invoice");lines=[];subtotal=0;discount=0;withholdingTax=0;withholdingRate=0;net=0;vatRate=0;vat=0;total=0;}
  else if(!financials)warnings.push("possibly-not-invoice");
  const confidenceParts=[supplier,invoiceNumber,date,total,net,lines.length].filter(Boolean).length;return{supplier,invoiceNumber,taxNumber,date,dueDate,currency,lines,subtotal,discount,withholdingTax,withholdingRate,net,vatRate,vat,total,confidence:Math.round(confidenceParts/6*100),rawText:raw,warnings:[...new Set(warnings)]};
}
