import type { CategoricalProfile, CellValue, CategoryBreakdown, DataQualityIssue, DateProfile, NumericProfile, SheetAnalysis, SheetData, SpreadsheetColumnInsight } from "@/types";

const MAX_ANALYSIS_ROWS = 60_000;
const MEDIAN_SAMPLE_SIZE = 8_000;
const DUPLICATE_SCAN_ROWS = 50_000;
const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const blank = (value: CellValue | undefined) => value === null || value === "" || value === undefined;
const asDate = (value: CellValue) => value instanceof Date && !Number.isNaN(value.getTime()) ? value : typeof value === "string" && /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(value) ? new Date(value) : null;
const median = (values: number[]) => { const sorted=[...values].sort((a,b)=>a-b), middle=Math.floor(sorted.length/2); return sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2; };
const identifierHeader = (header:string) => /(^|\s)(id|code|no\.?|number|phone|mobile|رقم|كود|هاتف|تليفون)(\s|$)/i.test(header);
const amountHeader = (header:string) => /(amount|value|total|net|cost|price|sales|revenue|expense|balance|مبلغ|قيمة|إجمالي|اجمالي|صافي|تكلفة|سعر|مبيعات|إيراد|مصروف|رصيد)/i.test(header);

function sampledRows(rows: CellValue[][]) {
  if (rows.length <= MAX_ANALYSIS_ROWS) return rows;
  const stride = rows.length / MAX_ANALYSIS_ROWS, result: CellValue[][]=[];
  for (let index=0; index<MAX_ANALYSIS_ROWS; index++) result.push(rows[Math.floor(index*stride)]);
  return result;
}

function boundedMedian(values:number[]) {
  if (values.length<=MEDIAN_SAMPLE_SIZE) return median(values);
  const stride=values.length/MEDIAN_SAMPLE_SIZE, sample:number[]=[];
  for(let index=0; index<MEDIAN_SAMPLE_SIZE; index++) sample.push(values[Math.floor(index*stride)]);
  return median(sample);
}

function topBreakdown(title:string, values:Map<string,number>): CategoryBreakdown | undefined {
  const positive=[...values.entries()].filter(([,value])=>Number.isFinite(value)&&value>0).sort((a,b)=>b[1]-a[1]);
  if(positive.length<2) return;
  const total=positive.reduce((sum,[,value])=>sum+value,0); if(total<=0) return;
  const visible=positive.slice(0,12), rest=positive.slice(12).reduce((sum,[,value])=>sum+value,0);
  if(rest>0) visible.push(["أخرى / Other",rest]);
  return { title,total:round(total),items:visible.map(([label,value])=>({label,value:round(value),percentage:round(value/total*100)})) };
}

function findBreakdown(sheet:SheetData, numeric:NumericProfile[], categorical:CategoricalProfile[]):CategoryBreakdown|undefined {
  // Horizontal summary: category names are headers and the first numeric row contains their values.
  const amountRow=sheet.rows.slice(0,20).find(row=>row.filter(value=>typeof value==="number"&&Number.isFinite(value)).length>=2);
  if(amountRow){
    const candidates=sheet.headers.map((label,index)=>({label,value:typeof amountRow[index]==="number"?amountRow[index] as number:Number.NaN})).filter(item=>Number.isFinite(item.value));
    const declaredTotal=candidates.find(item=>/الإجمالي|اجمالي|total/i.test(item.label));
    const map=new Map(candidates.filter(item=>item!==declaredTotal&&item.value>=0).map(item=>[item.label,item.value]));
    const breakdown=topBreakdown(sheet.name,map);
    if(breakdown&&declaredTotal&&declaredTotal.value>0) return {...breakdown,total:round(declaredTotal.value),items:breakdown.items.map(item=>({...item,percentage:round(item.value/declaredTotal.value*100)}))};
    if(breakdown) return breakdown;
  }
  // Vertical transaction table: aggregate the strongest amount column by a low-cardinality text column.
  const amount=numeric.find(profile=>amountHeader(profile.column)&&!identifierHeader(profile.column))??numeric.find(profile=>!identifierHeader(profile.column));
  const category=categorical.find(profile=>profile.unique>=2&&profile.unique<=Math.min(500,Math.max(12,sheet.rows.length*.35)));
  if(!amount||!category) return;
  const amountIndex=sheet.headers.indexOf(amount.column), categoryIndex=sheet.headers.indexOf(category.column), values=new Map<string,number>();
  for(const row of sheet.rows) { const raw=row[amountIndex], label=String(row[categoryIndex]??"").trim(); if(!label||typeof raw!=="number"||!Number.isFinite(raw)) continue; values.set(label,(values.get(label)||0)+Math.abs(raw)); }
  return topBreakdown(`${category.column} × ${amount.column}`,values);
}

export function analyzeSheet(sheet:SheetData):SheetAnalysis {
  const rows=sampledRows(sheet.rows), numeric:NumericProfile[]=[], categorical:CategoricalProfile[]=[], dates:DateProfile[]=[], columns:SpreadsheetColumnInsight[]=[], quality:DataQualityIssue[]=[];
  const totalCells=Math.max(1,rows.length*sheet.headers.length); let missingCells=0;
  sheet.headers.forEach((header,columnIndex)=>{
    const numbers:number[]=[], datesFound:Date[]=[], counts=new Map<string,number>(); let missing=0, negative=0, zero=0, sum=0, min=Infinity, max=-Infinity;
    for(const row of rows){ const value=row[columnIndex]??null; if(blank(value)){missing++; continue;} const date=asDate(value); if(typeof value==="number"&&Number.isFinite(value)){numbers.push(value);sum+=value;if(value<min)min=value;if(value>max)max=value;if(value<0)negative++;if(value===0)zero++;} else if(date) datesFound.push(date); counts.set(String(value),1+(counts.get(String(value))||0)); }
    missingCells+=missing; const present=rows.length-missing, numericRatio=numbers.length/Math.max(1,present), dateRatio=datesFound.length/Math.max(1,present);
    if(numbers.length>=2&&numericRatio>=.6){ const med=boundedMedian(numbers); numeric.push({column:header,count:numbers.length,missing,sum:round(sum),average:round(sum/numbers.length),minimum:min,maximum:max,median:round(med),negative,zero,shareOfNumericTotal:0}); if(!identifierHeader(header)&&numbers.some(value=>Math.abs(value)>Math.max(1,Math.abs(med))*100)) quality.push({severity:"medium",code:"extreme-value",column:header,message:"Contains possible outliers over 100× the median."}); }
    else if(datesFound.length>=2&&dateRatio>=.6){ let earliest=Infinity,latest=-Infinity; for(const date of datesFound){const time=date.getTime();if(time<earliest)earliest=time;if(time>latest)latest=time;} dates.push({column:header,count:datesFound.length,missing,earliest:new Date(earliest).toISOString().slice(0,10),latest:new Date(latest).toISOString().slice(0,10)}); }
    else { categorical.push({column:header,count:present,missing,unique:counts.size,topValues:[...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,10).map(([value,count])=>({value,count,percentage:round(count/Math.max(1,present)*100)}))}); }
    if(rows.length&&missing/rows.length>.3) quality.push({severity:"medium",code:"many-missing",column:header,message:"More than 30% of values are missing."});
    if(present&&numbers.length>0&&numericRatio<.6) quality.push({severity:"low",code:"mixed-types",column:header,message:"The column mixes numbers with text; review formatting."});
    const inferredType:SpreadsheetColumnInsight["type"]=identifierHeader(header)?"identifier":numericRatio>=.6?"number":dateRatio>=.6?"date":counts.size<=Math.max(20,present*.35)?"category":numbers.length||datesFound.length?"mixed":"category";
    const confidence=round(Math.max(numericRatio,dateRatio,inferredType==="identifier"?.95:counts.size?1-Math.min(.45,counts.size/Math.max(1,present)*.25):0)*100);
    const role:SpreadsheetColumnInsight["role"]=identifierHeader(header)?"identifier":amountHeader(header)&&inferredType==="number"?"amount":inferredType==="number"?"measure":inferredType==="date"?"date":inferredType==="category"?"category":"text";
    columns.push({column:header,type:inferredType,confidence,completeness:round(present/Math.max(1,rows.length)*100),distinct:counts.size||new Set(numbers).size||new Set(datesFound.map(date=>date.toISOString())).size,role});
  });
  if(sheet.rows.length>rows.length){
    for(const profile of numeric){
      const columnIndex=sheet.headers.indexOf(profile.column);let count=0,missing=0,sum=0,min=Infinity,max=-Infinity,negative=0,zero=0;
      for(const row of sheet.rows){const value=row[columnIndex]??null;if(blank(value)){missing++;continue;}if(typeof value!=="number"||!Number.isFinite(value))continue;count++;sum+=value;if(value<min)min=value;if(value>max)max=value;if(value<0)negative++;if(value===0)zero++;}
      Object.assign(profile,{count,missing,sum:round(sum),average:count?round(sum/count):0,minimum:count?min:0,maximum:count?max:0,negative,zero});
    }
  }
  const absoluteTotal=numeric.reduce((sum,profile)=>sum+Math.abs(profile.sum),0); numeric.forEach(profile=>profile.shareOfNumericTotal=absoluteTotal?round(Math.abs(profile.sum)/absoluteTotal*100):0);
  const completeness=round((1-missingCells/totalCells)*100); if(completeness<80) quality.push({severity:"high",code:"sparse-data",message:"More than 20% of the analyzed cells are blank."});
  const seen=new Set<string>(); let duplicateRows=0; const duplicateScan=rows.slice(0,DUPLICATE_SCAN_ROWS); for(const row of duplicateScan){const key=JSON.stringify(row);if(seen.has(key))duplicateRows++;else seen.add(key);} if(duplicateRows) quality.push({severity:"medium",code:"duplicate-rows",message:`${duplicateRows} duplicate rows detected${rows.length>DUPLICATE_SCAN_ROWS?" in the scan sample":""}.`});
  if(sheet.rows.length>rows.length) quality.unshift({severity:"low",code:"sampled-analysis",message:`Large sheet: ${rows.length.toLocaleString()} representative rows were analyzed from ${sheet.rows.length.toLocaleString()} rows.`});
  const normalizedHeaders=sheet.headers.map((header)=>header.trim().toLowerCase()), duplicateHeaders=normalizedHeaders.filter((header,index)=>normalizedHeaders.indexOf(header)!==index);
  if(duplicateHeaders.length) quality.push({severity:"high",code:"duplicate-headers",message:`Duplicate headers: ${[...new Set(duplicateHeaders)].join(", ")}`});
  categorical.filter((profile)=>profile.unique===1&&profile.count>1).forEach((profile)=>quality.push({severity:"low",code:"constant-column",column:profile.column,message:"The column contains one repeated value and adds little analytical value."}));
  const formulaErrors=rows.reduce((sum,row)=>sum+row.filter(value=>typeof value==="string"&&/^#(REF!|DIV\/0!|VALUE!|NAME\?|N\/A|NUM!)/i.test(value)).length,0);if(formulaErrors)quality.push({severity:"high",code:"formula-errors",message:`${formulaErrors} spreadsheet formula errors detected.`});
  const typeConfidence=columns.reduce((sum,column)=>sum+column.confidence,0)/Math.max(1,columns.length),high=quality.filter(issue=>issue.severity==="high").length,medium=quality.filter(issue=>issue.severity==="medium").length,duplicateRate=duplicateRows/Math.max(1,Math.min(rows.length,DUPLICATE_SCAN_ROWS));
  const qualityScore=Math.max(0,Math.min(100,Math.round(completeness*.5+(sheet.readDiagnostics?.headerConfidence??70)*.2+typeConfidence*.2+10-high*8-medium*3-duplicateRate*30)));
  return {name:sheet.name,headers:sheet.headers,rows:sheet.rows,headerRowIndex:sheet.headerRowIndex,rowCount:sheet.rows.length,analyzedRows:rows.length,sampled:sheet.rows.length>rows.length,completeness,qualityScore,duplicateRows,columnCount:sheet.headers.length,numeric,categorical,dates,columns,quality,readDiagnostics:sheet.readDiagnostics,breakdown:findBreakdown(sheet,numeric,categorical),preview:sheet.rows.slice(0,25)};
}
