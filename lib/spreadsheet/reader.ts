import type { CellValue, SheetData } from "@/types";

export interface SpreadsheetReadProgress { stage:"opening"|"parsing"|"normalizing"|"done"; percent:number; sheet?:string; }
export interface SpreadsheetReadOptions { onProgress?:(progress:SpreadsheetReadProgress)=>void; }
const MAX_BROWSER_FILE_BYTES=120*1024*1024;
const yieldToBrowser=()=>new Promise<void>(resolve=>window.setTimeout(resolve,0));

const typed=(value:unknown):CellValue=>{
  if(value===null||value===undefined||value==="") return null;
  if(value instanceof Date) return value;
  if(typeof value==="number"||typeof value==="boolean") return value;
  const text=String(value).trim(), percentage=text.endsWith("%"), normalized=text.replace(/[٠-٩]/g,digit=>String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))).replace(/[۰-۹]/g,digit=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))).replace(/[٬,]/g,"").replace(/٫/g,".").replace(/%$/,"").trim();
  const number=Number(normalized); if(text&&Number.isFinite(number)&&/^-?[\d٠-٩۰-۹٬,٫.]+%?$/.test(text)) return percentage?number/100:number;
  return text;
};

function detectDelimiter(text:string){
  const lines=text.slice(0,40_000).split(/\r?\n/).filter(Boolean).slice(0,30), candidates=[",",";","\t","|"];
  return candidates.map(delimiter=>{const counts=lines.map(line=>line.split(delimiter).length-1),positive=counts.filter(Boolean),average=positive.reduce((sum,count)=>sum+count,0)/Math.max(1,positive.length),variance=positive.reduce((sum,count)=>sum+Math.abs(count-average),0)/Math.max(1,positive.length);return{delimiter,score:positive.length*10+average-variance};}).sort((a,b)=>b.score-a.score)[0].delimiter;
}

function parseDelimited(text:string):CellValue[][]{
  const delimiter=detectDelimiter(text), rows:CellValue[][]=[], row:string[]=[], pushCell=()=>{row.push(value.trim());value="";};
  let value="",quoted=false;
  for(let index=0;index<text.length;index++){
    const char=text[index];
    if(char==='"'){if(quoted&&text[index+1]==='"'){value+='"';index++;}else quoted=!quoted;continue;}
    if(char===delimiter&&!quoted){pushCell();continue;}
    if((char==='\n'||char==='\r')&&!quoted){if(char==='\r'&&text[index+1]==='\n')index++;pushCell();if(row.some(cell=>cell!==""))rows.push(row.map(typed));row.length=0;continue;}
    value+=char;
  }
  pushCell(); if(row.some(cell=>cell!==""))rows.push(row.map(typed)); return rows;
}

function headerScore(row:CellValue[]){
  const values=row.filter(value=>value!==null&&value!==""), strings=values.filter(value=>typeof value==="string"), unique=new Set(strings.map(value=>String(value).toLowerCase())).size;
  if(values.length<2)return-Infinity;
  return strings.length*4+unique*2+values.length-values.filter(value=>typeof value==="number").length*3;
}

function uniqueHeaders(values:CellValue[],width:number){
  const seen=new Map<string,number>();
  return Array.from({length:width},(_,index)=>{
    const raw=String(values[index]??"").trim()||`Column ${index+1}`, count=(seen.get(raw)||0)+1; seen.set(raw,count); return count===1?raw:`${raw} (${count})`;
  });
}

function normalizeSheet(name:string,matrix:CellValue[][]):SheetData{
  const nonEmpty:CellValue[][]=[]; let width=0; for(const row of matrix){if(!row.some(value=>value!==null&&value!==""))continue;nonEmpty.push(row);if(row.length>width)width=row.length;} if(!nonEmpty.length)return{name,headers:[],rows:[]};
  const searchLimit=Math.min(25,nonEmpty.length); let best=0,bestScore=-Infinity;
  for(let index=0;index<searchLimit;index++){const next=nonEmpty[index+1]||[],nextValues=next.filter(value=>value!==null&&value!=="").length,score=headerScore(nonEmpty[index])+Math.min(8,nextValues)*.5-index*.15;if(score>bestScore){best=index;bestScore=score;}}
  const used=new Uint8Array(width);for(let rowIndex=best;rowIndex<nonEmpty.length;rowIndex++){const row=nonEmpty[rowIndex];for(let column=0;column<row.length;column++)if(row[column]!==null&&row[column]!=="")used[column]=1;}
  const keepColumns:number[]=[];for(let column=0;column<width;column++)if(used[column])keepColumns.push(column);
  const headers=uniqueHeaders(keepColumns.map(index=>nonEmpty[best][index]),keepColumns.length);
  const rows=nonEmpty.slice(best+1).map(row=>keepColumns.map(index=>row[index]??null)).filter(row=>row.some(value=>value!==null&&value!==""));
  return{name:name||"Sheet",headers,rows};
}

export async function readSpreadsheet(file:File,options:SpreadsheetReadOptions={}):Promise<SheetData[]>{
  const report=(stage:SpreadsheetReadProgress["stage"],percent:number,sheet?:string)=>options.onProgress?.({stage,percent,sheet});
  const lower=file.name.toLowerCase(); if(file.size>MAX_BROWSER_FILE_BYTES)throw new Error("The workbook is over 120 MB. Split it into smaller workbooks for safe browser analysis.");
  if(lower.endsWith(".xls"))throw new Error("Legacy .xls is not supported. Save the workbook as .xlsx first.");
  report("opening",5);
  if(lower.endsWith(".csv")||file.type.includes("csv")){const buffer=await file.arrayBuffer();let text=new TextDecoder("utf-8").decode(buffer);if((text.match(/\uFFFD/g)||[]).length>2)try{text=new TextDecoder("windows-1256").decode(buffer);}catch{}text=text.replace(/^\uFEFF/,"");report("parsing",35);await yieldToBrowser();const matrix=parseDelimited(text);report("normalizing",75,file.name);await yieldToBrowser();const result=normalizeSheet(file.name.replace(/\.csv$/i,""),matrix);report("done",100,result.name);return[result];}
  if(!lower.endsWith(".xlsx"))throw new Error("Supported formats are .xlsx and .csv");
  report("parsing",15); const excelReader=await import("read-excel-file/browser"), workbook=await excelReader.default(file), sheets:SheetData[]=[];
  for(let index=0;index<workbook.length;index++){const sheet=workbook[index];report("normalizing",25+Math.round(index/Math.max(1,workbook.length)*70),sheet.sheet);await yieldToBrowser();sheets.push(normalizeSheet(sheet.sheet,sheet.data.map(row=>row.map(typed))));}
  report("done",100);return sheets;
}
