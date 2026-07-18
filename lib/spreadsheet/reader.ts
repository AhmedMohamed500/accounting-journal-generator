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
  const sample=text.slice(0,20_000), candidates=[",",";","\t"];
  return candidates.map(delimiter=>({delimiter,count:sample.split(delimiter).length-1})).sort((a,b)=>b.count-a.count)[0].delimiter;
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
  const values=row.filter(value=>value!==null&&value!==""), strings=values.filter(value=>typeof value==="string"), unique=new Set(strings.map(String)).size;
  return strings.length*3+unique-values.filter(value=>typeof value==="number").length*2;
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
  for(let index=0;index<searchLimit;index++){const score=headerScore(nonEmpty[index]);if(score>bestScore){best=index;bestScore=score;}}
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
  if(lower.endsWith(".csv")||file.type.includes("csv")){const text=(await file.text()).replace(/^\uFEFF/,"");report("parsing",35);await yieldToBrowser();const matrix=parseDelimited(text);report("normalizing",75,file.name);await yieldToBrowser();const result=normalizeSheet(file.name.replace(/\.csv$/i,""),matrix);report("done",100,result.name);return[result];}
  if(!lower.endsWith(".xlsx"))throw new Error("Supported formats are .xlsx and .csv");
  report("parsing",15); const excelReader=await import("read-excel-file/browser"), workbook=await excelReader.default(file), sheets:SheetData[]=[];
  for(let index=0;index<workbook.length;index++){const sheet=workbook[index];report("normalizing",25+Math.round(index/Math.max(1,workbook.length)*70),sheet.sheet);await yieldToBrowser();sheets.push(normalizeSheet(sheet.sheet,sheet.data.map(row=>row.map(typed))));}
  report("done",100);return sheets;
}
