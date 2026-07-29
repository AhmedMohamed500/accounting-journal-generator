import type { ExtractedInvoice, ExtractedInvoiceLine } from "@/types";
import { normalizeArabicNumbers } from "@/lib/parser/normalize";
import { roundCurrency } from "@/lib/accounting/calculations";

const amountToken=/-?[0-9][0-9,٬]*(?:[.٫][0-9]{1,3})?%?/g;
const numeric=(value:string)=>{
  let text=value.replace(/[%\s٬،]/g,"").replace(/٫/g,".");
  const comma=text.lastIndexOf(","),dot=text.lastIndexOf(".");
  if(comma>=0&&dot>=0){const decimal=Math.max(comma,dot);text=text.slice(0,decimal).replace(/[,.]/g,"")+"."+text.slice(decimal+1).replace(/[,.]/g,"");}
  else if(comma>=0){const decimals=text.length-comma-1;text=decimals===1||decimals===2?text.replace(",","."):text.replace(/,/g,"");}
  else if(dot>=0){const decimals=text.length-dot-1;if(decimals===3&&dot>0)text=text.replace(/\./g,"");}
  return Number(text)||0;
};
const clean=(value:string)=>value.replace(/^[\s:#|–—-]+|[\s:#|–—-]+$/g,"").trim();
const linesOf=(text:string)=>text.split(/\r?\n/).map(line=>line.replace(/[\t ]+/g," ").trim()).filter(Boolean);

function amount(text:string,labels:string[]){
  for(const line of linesOf(text))for(const label of labels){const matcher=new RegExp(label,"i"),match=matcher.exec(line);if(!match)continue;const after=line.slice(match.index+match[0].length,match.index+match[0].length+55).match(amountToken)?.find(token=>!token.endsWith("%"));if(after)return numeric(after);const before=line.slice(Math.max(0,match.index-55),match.index).match(amountToken)?.filter(token=>!token.endsWith("%")).at(-1);if(before)return numeric(before);}
  return 0;
}

function value(text:string,labels:string[]){
  for(const line of linesOf(text))for(const label of labels){const matcher=new RegExp(label,"i"),match=matcher.exec(line);if(!match)continue;const after=clean(line.slice(match.index+match[0].length));if(after&&after.length<=120)return after;const before=clean(line.slice(0,match.index));if(before&&before.length<=120)return before;}
  return"";
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
  const ignore=/(subtotal|grand total|invoice total|invoice(?: no| number)?|due date|^date\b|net amount|tax amount|vat amount|الإجمالي|الصافي|الضريبة|رقم الفاتورة|تاريخ|supplier|vendor|المورد|صفحة|page)/i,results:ExtractedInvoiceLine[]=[];
  for(const source of linesOf(text)){if(ignore.test(source))continue;const tokens=(source.match(amountToken)||[]).map(token=>token.trim()).filter(Boolean);if(tokens.length<3||tokens.some(token=>/^20\d{2}$/.test(token)))continue;const description=clean(source.replace(amountToken," ").replace(/\s+/g," ").replace(/^[.)\-\d\s]+/,""));if(description.length<2||description.length>140)continue;const reversed=[...tokens].reverse(),candidates=[lineCandidate(tokens,0,fallbackRate),lineCandidate(tokens,1,fallbackRate),lineCandidate(reversed,0,fallbackRate),lineCandidate(reversed,1,fallbackRate)].filter(Boolean) as NonNullable<ReturnType<typeof lineCandidate>>[];if(!candidates.length)continue;const candidate=candidates.sort((a,b)=>a.score-b.score)[0];results.push({id:`line-${results.length+1}`,description,quantity:candidate.quantity,unitPrice:candidate.unitPrice,discount:candidate.discount,vatRate:candidate.vatRate,net:candidate.net,vat:candidate.vat,total:candidate.total});if(results.length>=200)break;
  }
  return results;
}

function invoiceNumberFrom(text:string){const raw=value(text,["invoice(?: no| number| #)?","رقم الفاتورة","فاتورة رقم"]),token=raw.match(/[A-Z0-9][A-Z0-9\/_-]{1,35}/i)?.[0];return token||"";}

export function parseInvoiceText(raw:string):ExtractedInvoice{
  const text=normalizeArabicNumbers(raw).normalize("NFKC").replace(/\u00a0/g," ").replace(/[ \t]+/g," ").replace(/إجمالى/g,"إجمالي").replace(/الضريبه/g,"الضريبة").replace(/فاتوره/g,"فاتورة"),hasInvoiceLabel=/(?:tax invoice|invoice|فاتورة)/i.test(text);
  const invoiceNumber=invoiceNumberFrom(text),taxNumber=value(text,["tax(?: registration)?(?: no| number)?","VAT No","الرقم الضريبي","رقم التسجيل الضريبي"]).replace(/[^0-9A-Za-z-]/g,"").slice(0,30),supplier=value(text,["supplier name","supplier","vendor","اسم المورد","المورد","البائع"])||inferSupplier(text);
  const explicitDate=text.match(/(?:invoice date|تاريخ الفاتورة|تاريخ الاصدار)\s*[:#-]?\s*(\d{1,4}[\/-]\d{1,2}[\/-]\d{1,4})/i),genericDate=hasInvoiceLabel?text.match(/(?:^|\n)(?:date|التاريخ)\s*[:#-]?\s*(\d{1,4}[\/-]\d{1,2}[\/-]\d{1,4})/im)||text.match(/\b(\d{4}-\d{2}-\d{2})\b/):null,dueMatch=text.match(/(?:due date|تاريخ الاستحقاق)\s*[:#-]?\s*(\d{1,4}[\/-]\d{1,2}[\/-]\d{1,4})/i),date=isoDate((explicitDate||genericDate)?.[1]||""),dueDate=isoDate(dueMatch?.[1]||"");
  let total=amount(text,["grand total","total amount","invoice total","amount due","الإجمالي شامل الضريبة","إجمالي الفاتورة","المبلغ المستحق","الإجمالي"]),vat=amount(text,["VAT amount","tax amount","قيمة ضريبة القيمة المضافة","قيمة الضريبة","الضريبة"]),discount=amount(text,["discount total","total discount","إجمالي الخصم","الخصم"]),subtotal=amount(text,["subtotal","gross amount","الإجمالي قبل الخصم","المجموع"]),net=amount(text,["net amount","amount before tax","taxable amount","الصافي","الإجمالي قبل الضريبة","قبل الضريبة"]);
  if(!net&&subtotal)net=roundCurrency(Math.max(0,subtotal-discount));if(!net&&total&&vat)net=roundCurrency(total-vat);if(!vat&&total&&net&&total>=net)vat=roundCurrency(total-net);if(!total&&net)total=roundCurrency(net+vat);if(!subtotal&&net)subtotal=roundCurrency(net+discount);
  const rateMatch=text.match(/(?:VAT|ضريبة القيمة المضافة|الضريبة)\s*(?:rate|نسبة)?\s*[:#-]?\s*(\d+(?:\.\d+)?)\s*%/i);let vatRate=rateMatch?Number(rateMatch[1]):net&&vat?roundCurrency(vat/net*100):0,lines=lineItems(text,vatRate);
  if(lines.length){const lineNet=roundCurrency(lines.reduce((sum,line)=>sum+line.net,0)),lineVat=roundCurrency(lines.reduce((sum,line)=>sum+line.vat,0)),lineTotal=roundCurrency(lines.reduce((sum,line)=>sum+line.total,0));if(!net)net=lineNet;if(!vat)vat=lineVat;if(!total)total=lineTotal;if(!subtotal)subtotal=roundCurrency(net+discount);if(!vatRate&&net)vatRate=roundCurrency(vat/net*100);}
  const currency=/\bUSD\b|دولار/i.test(text)?"USD":/\bSAR\b|ريال/i.test(text)?"SAR":/\bAED\b|درهم/i.test(text)?"AED":/\bEUR\b|يورو/i.test(text)?"EUR":"EGP",warnings:string[]=[];
  if(!supplier)warnings.push("supplier");if(!invoiceNumber)warnings.push("invoice-number");if(!date)warnings.push("date");if(!total)warnings.push("total");if(!lines.length)warnings.push("line-items");if(total&&net&&Math.abs(total-net-vat)>Math.max(.05,total*.005))warnings.push("totals-do-not-match");
  const identity=Boolean(invoiceNumber||supplier||hasInvoiceLabel),financials=Boolean(total>0&&(net>0||lines.length));if(!identity||!financials){warnings.push("possibly-not-invoice");lines=[];subtotal=0;discount=0;net=0;vatRate=0;vat=0;total=0;}
  const confidenceParts=[supplier,invoiceNumber,date,total,net,lines.length].filter(Boolean).length;return{supplier,invoiceNumber,taxNumber,date,dueDate,currency,lines,subtotal,discount,net,vatRate,vat,total,confidence:Math.round(confidenceParts/6*100),rawText:raw,warnings:[...new Set(warnings)]};
}
