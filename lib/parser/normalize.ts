const arabicDigits="٠١٢٣٤٥٦٧٨٩"; const persianDigits="۰۱۲۳۴۵۶۷۸۹";
export function normalizeArabicNumbers(value:string){return value.replace(/[٠-٩]/g,d=>String(arabicDigits.indexOf(d))).replace(/[۰-۹]/g,d=>String(persianDigits.indexOf(d))).replace(/٬/g,",").replace(/٫/g,".").replace(/(\d+(?:\.\d+)?)\s*(?:k|ألف)/gi,(_,n)=>String(Number(n)*1000));}
