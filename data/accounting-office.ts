export type OfficeClient = {
  id: string; name: string; activity: string; accountant: string; completion: number;
  missing: number; status: "منتظم" | "يحتاج متابعة" | "متأخر"; lastUpload: string;
};

export type OfficeTask = {
  id: string; title: string; client: string; assignee: string; service: string;
  due: string; priority: "منخفضة" | "متوسطة" | "عالية" | "حرجة";
  status: "جديدة" | "جاري العمل" | "انتظار العميل" | "جاهزة للمراجعة" | "مكتملة";
  progress: number;
};

export const officeClients: OfficeClient[] = [
  { id:"CL-101", name:"شركة النيل للتوريدات", activity:"تجارة وتوزيع", accountant:"أحمد حسن", completion:92, missing:1, status:"منتظم", lastUpload:"اليوم، 09:40" },
  { id:"CL-102", name:"مركز الصفوة الطبي", activity:"خدمات طبية", accountant:"سارة محمود", completion:68, missing:4, status:"يحتاج متابعة", lastUpload:"أمس، 16:15" },
  { id:"CL-103", name:"مصنع دلتا للبلاستيك", activity:"تصنيع", accountant:"محمد فوزي", completion:81, missing:2, status:"منتظم", lastUpload:"12 يوليو 2026" },
  { id:"CL-104", name:"مطاعم بيت المذاق", activity:"مطاعم وضيافة", accountant:"مريم علي", completion:43, missing:7, status:"متأخر", lastUpload:"8 يوليو 2026" },
  { id:"CL-105", name:"رواد للمقاولات", activity:"مقاولات", accountant:"أحمد حسن", completion:75, missing:3, status:"يحتاج متابعة", lastUpload:"11 يوليو 2026" },
];

export const officeTasks: OfficeTask[] = [
  { id:"TK-301", title:"مراجعة إقرار القيمة المضافة", client:"شركة النيل للتوريدات", assignee:"سارة محمود", service:"ضرائب", due:"15 يوليو", priority:"حرجة", status:"جاهزة للمراجعة", progress:90 },
  { id:"TK-302", title:"مطابقة كشف بنك CIB", client:"مصنع دلتا للبلاستيك", assignee:"محمد فوزي", service:"إمساك دفاتر", due:"16 يوليو", priority:"عالية", status:"جاري العمل", progress:65 },
  { id:"TK-303", title:"استكمال فواتير المشتريات", client:"مطاعم بيت المذاق", assignee:"مريم علي", service:"مستندات", due:"14 يوليو", priority:"حرجة", status:"انتظار العميل", progress:35 },
  { id:"TK-304", title:"إقفال رواتب يونيو", client:"مركز الصفوة الطبي", assignee:"سارة محمود", service:"رواتب", due:"18 يوليو", priority:"متوسطة", status:"جاري العمل", progress:55 },
  { id:"TK-305", title:"تجهيز ميزان المراجعة", client:"رواد للمقاولات", assignee:"أحمد حسن", service:"قوائم مالية", due:"20 يوليو", priority:"عالية", status:"جديدة", progress:10 },
  { id:"TK-306", title:"اعتماد قيد تسوية مخزون", client:"شركة النيل للتوريدات", assignee:"محمد فوزي", service:"مراجعة", due:"13 يوليو", priority:"عالية", status:"مكتملة", progress:100 },
];

export const officeEntries = [
  { id:"JE-2607-184", client:"شركة النيل للتوريدات", document:"PI-4588", description:"فاتورة مشتريات مخزون", debit:11400, credit:11400, errors:0, risk:"سليم" },
  { id:"JE-2607-185", client:"مركز الصفوة الطبي", document:"EXP-778", description:"مصروف صيانة أجهزة", debit:8250, credit:8000, errors:1, risk:"حرج" },
  { id:"JE-2607-186", client:"رواد للمقاولات", document:"PAY-290", description:"مستخلص مقاول باطن", debit:56000, credit:56000, errors:2, risk:"تحذير" },
  { id:"JE-2607-187", client:"مطاعم بيت المذاق", document:"SAL-0626", description:"إثبات رواتب مستحقة", debit:74200, credit:74200, errors:0, risk:"سليم" },
] as const;

export const officeTeam = [
  { name:"أحمد حسن", role:"مدير حسابات", clients:7, open:8, late:1, performance:94 },
  { name:"سارة محمود", role:"محاسب ضرائب", clients:6, open:6, late:0, performance:97 },
  { name:"محمد فوزي", role:"محاسب عام", clients:5, open:9, late:2, performance:88 },
  { name:"مريم علي", role:"محاسب تحت التدريب", clients:3, open:5, late:1, performance:82 },
] as const;

export const officeActivities = [
  "سارة أنهت مراجعة إقرار شركة النيل للتوريدات",
  "تم رفع كشف بنك جديد لمصنع دلتا للبلاستيك",
  "اكتشف مراجع القيود فرقًا بقيمة 250 ج.م في JE-2607-185",
  "أُرسلت مطالبة مستندات إلى مطاعم بيت المذاق",
] as const;
