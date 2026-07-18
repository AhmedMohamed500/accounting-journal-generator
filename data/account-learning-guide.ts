export type AccountGuideCategory = "assets" | "liabilities" | "equity" | "revenue" | "expenses" | "contra";

export interface AccountLearningGuideItem {
  code: string;
  nameAr: string;
  nameEn: string;
  category: AccountGuideCategory;
  categoryAr: string;
  normalAr: "مدينة" | "دائنة";
  normalEn: "Debit" | "Credit";
  increaseSideAr: "مدين" | "دائن";
  decreaseSideAr: "مدين" | "دائن";
  increaseEffectAr: string;
  decreaseEffectAr: string;
  statementAr: string;
  documentsAr: string;
  cycleAr: string;
  exampleAr: string;
}

const item = (value: AccountLearningGuideItem) => value;

const coreAccountLearningGuide: AccountLearningGuideItem[] = [
  item({ code:"1100",nameAr:"الصندوق",nameEn:"Cash on hand",category:"assets",categoryAr:"أصل متداول",normalAr:"مدينة",normalEn:"Debit",increaseSideAr:"مدين",decreaseSideAr:"دائن",increaseEffectAr:"يزيد النقد المتاح وإجمالي الأصول.",decreaseEffectAr:"يخفض النقد وإجمالي الأصول، وقد يصاحبه مصروف أو أصل أو سداد التزام.",statementAr:"قائمة المركز المالي — الأصول المتداولة",documentsAr:"سند قبض، سند صرف، إيصال، محضر جرد خزينة",cycleAr:"قبض أو صرف ← مراجعة السند ← قيد اليومية ← أستاذ الصندوق ← ميزان المراجعة ← المركز المالي",exampleAr:"قبض 5,000 من عميل: من حـ/ الصندوق إلى حـ/ العميل." }),
  item({ code:"1110",nameAr:"البنك",nameEn:"Bank",category:"assets",categoryAr:"أصل متداول",normalAr:"مدينة",normalEn:"Debit",increaseSideAr:"مدين",decreaseSideAr:"دائن",increaseEffectAr:"يزيد رصيد البنك والسيولة والأصول.",decreaseEffectAr:"يخفض رصيد البنك والسيولة والأصول.",statementAr:"قائمة المركز المالي — الأصول المتداولة",documentsAr:"إشعار إيداع، تحويل بنكي، شيك، كشف بنك",cycleAr:"حركة بنكية ← إثبات القيد ← المطابقة مع كشف البنك ← أستاذ البنك ← التقارير",exampleAr:"سداد مورد 10,000: من حـ/ المورد إلى حـ/ البنك." }),
  item({ code:"1120",nameAr:"العملاء",nameEn:"Accounts receivable",category:"assets",categoryAr:"أصل متداول",normalAr:"مدينة",normalEn:"Debit",increaseSideAr:"مدين",decreaseSideAr:"دائن",increaseEffectAr:"يزيد حق المنشأة لدى الغير والأصول، وغالبًا يقابله إيراد بيع آجل.",decreaseEffectAr:"يخفض المديونية عند التحصيل أو المردود أو الخصم.",statementAr:"قائمة المركز المالي — العملاء، مع أعمار الديون",documentsAr:"فاتورة بيع، إذن تسليم، سند قبض، إشعار دائن",cycleAr:"طلب بيع ← تسليم ← فاتورة ← قيد عميل ← متابعة استحقاق ← تحصيل ← إقفال الفاتورة",exampleAr:"بيع آجل 20,000: من حـ/ العميل إلى حـ/ المبيعات." }),
  item({ code:"1130",nameAr:"أوراق القبض",nameEn:"Notes receivable",category:"assets",categoryAr:"أصل متداول",normalAr:"مدينة",normalEn:"Debit",increaseSideAr:"مدين",decreaseSideAr:"دائن",increaseEffectAr:"يزيد حق المنشأة المثبت بشيك أو كمبيالة.",decreaseEffectAr:"ينخفض عند التحصيل أو الارتداد أو التحويل للبنك.",statementAr:"قائمة المركز المالي — أصول متداولة",documentsAr:"شيك وارد، كمبيالة، إيصال استلام، إشعار تحصيل",cycleAr:"استلام ورقة ← تسجيل بياناتها ← متابعة الاستحقاق ← تحصيل/ارتداد ← تسوية الحساب",exampleAr:"استلام شيك من عميل: من حـ/ أوراق القبض إلى حـ/ العميل." }),
  item({ code:"1140",nameAr:"المخزون",nameEn:"Inventory",category:"assets",categoryAr:"أصل متداول",normalAr:"مدينة",normalEn:"Debit",increaseSideAr:"مدين",decreaseSideAr:"دائن",increaseEffectAr:"يزيد كمية وقيمة البضاعة وإجمالي الأصول.",decreaseEffectAr:"ينخفض عند البيع أو التلف أو العجز، ويظهر المقابل غالبًا تكلفة مبيعات.",statementAr:"قائمة المركز المالي — المخزون",documentsAr:"طلب شراء، أمر شراء، إذن استلام، فاتورة مورد، إذن صرف مخزني",cycleAr:"طلب شراء ← اعتماد ← أمر شراء ← استلام وفحص ← فاتورة ← قيد مخزون ← صرف/بيع ← جرد",exampleAr:"شراء بضاعة آجل: من حـ/ المخزون إلى حـ/ الموردين." }),
  item({ code:"1150",nameAr:"مصروفات مدفوعة مقدمًا",nameEn:"Prepaid expenses",category:"assets",categoryAr:"أصل متداول",normalAr:"مدينة",normalEn:"Debit",increaseSideAr:"مدين",decreaseSideAr:"دائن",increaseEffectAr:"يزيد أصل يمثل منفعة مستقبلية، ولا يخفض الربح كله فورًا.",decreaseEffectAr:"ينخفض الجزء المستخدم ويُحمّل على مصروف الفترة فيخفض الربح.",statementAr:"قائمة المركز المالي ثم قائمة الدخل عند الاستهلاك",documentsAr:"عقد، فاتورة، سند دفع، جدول توزيع",cycleAr:"دفع مقدم ← إثبات أصل ← توزيع شهري ← قيد تسوية ← مصروف الفترة",exampleAr:"دفع تأمين سنة: أصل مقدم، ثم كل شهر من حـ/ التأمين إلى حـ/ المدفوع مقدمًا." }),
  item({ code:"1200",nameAr:"الأصول الثابتة",nameEn:"Property, plant and equipment",category:"assets",categoryAr:"أصل غير متداول",normalAr:"مدينة",normalEn:"Debit",increaseSideAr:"مدين",decreaseSideAr:"دائن",increaseEffectAr:"يزيد الطاقة الإنتاجية والأصول طويلة الأجل، وليس مصروفًا فوريًا.",decreaseEffectAr:"ينخفض عند البيع أو الاستبعاد، مع حساب ربح أو خسارة التصرف.",statementAr:"قائمة المركز المالي — أصول غير متداولة",documentsAr:"طلب رأسمالي، عرض سعر، فاتورة، محضر استلام، سجل أصل",cycleAr:"طلب أصل ← اعتماد رأسمالي ← شراء واستلام ← ترميز الأصل ← إهلاك دوري ← جرد/استبعاد",exampleAr:"شراء آلة نقدًا: من حـ/ الآلات إلى حـ/ البنك." }),
  item({ code:"1210",nameAr:"مجمع الإهلاك",nameEn:"Accumulated depreciation",category:"contra",categoryAr:"حساب مقابل للأصل",normalAr:"دائنة",normalEn:"Credit",increaseSideAr:"دائن",decreaseSideAr:"مدين",increaseEffectAr:"يخفض صافي القيمة الدفترية للأصل دون خفض تكلفته الأصلية.",decreaseEffectAr:"ينخفض عند استبعاد الأصل أو تصحيح الإهلاك.",statementAr:"يُخصم من الأصول الثابتة في المركز المالي",documentsAr:"سجل الأصول، سياسة الإهلاك، كشف الإهلاك",cycleAr:"سجل أصل ← احتساب شهري ← قيد إهلاك ← مراجعة العمر والقيمة ← القوائم",exampleAr:"قيد الإهلاك: من حـ/ مصروف الإهلاك إلى حـ/ مجمع الإهلاك." }),
  item({ code:"2100",nameAr:"الموردون",nameEn:"Accounts payable",category:"liabilities",categoryAr:"التزام متداول",normalAr:"دائنة",normalEn:"Credit",increaseSideAr:"دائن",decreaseSideAr:"مدين",increaseEffectAr:"يزيد ما على المنشأة والتزاماتها بسبب شراء آجل.",decreaseEffectAr:"ينخفض عند السداد أو مردود المشتريات أو الخصم المكتسب.",statementAr:"قائمة المركز المالي — الالتزامات المتداولة، مع أعمار الدائنين",documentsAr:"فاتورة مورد، أمر شراء، إذن استلام، سند صرف، إشعار خصم",cycleAr:"أمر شراء ← استلام ← مطابقة ثلاثية ← فاتورة ← اعتماد ← استحقاق ← سداد ← إقفال",exampleAr:"سداد مورد: من حـ/ الموردين إلى حـ/ البنك." }),
  item({ code:"2110",nameAr:"أوراق الدفع",nameEn:"Notes payable",category:"liabilities",categoryAr:"التزام متداول",normalAr:"دائنة",normalEn:"Credit",increaseSideAr:"دائن",decreaseSideAr:"مدين",increaseEffectAr:"يزيد التزام المنشأة المثبت بشيك أو كمبيالة.",decreaseEffectAr:"ينخفض عند صرف الورقة أو إلغائها.",statementAr:"قائمة المركز المالي — التزامات متداولة",documentsAr:"شيك صادر، كمبيالة، طلب دفع، إشعار خصم بنك",cycleAr:"اعتماد دفع ← إصدار ورقة ← تسليم ← متابعة الاستحقاق ← صرف بالبنك ← مطابقة",exampleAr:"إصدار شيك لمورد: من حـ/ المورد إلى حـ/ أوراق الدفع." }),
  item({ code:"2120",nameAr:"مصروفات مستحقة",nameEn:"Accrued expenses",category:"liabilities",categoryAr:"التزام متداول",normalAr:"دائنة",normalEn:"Credit",increaseSideAr:"دائن",decreaseSideAr:"مدين",increaseEffectAr:"يزيد الالتزام ويثبت مصروف الفترة فينخفض الربح قبل السداد.",decreaseEffectAr:"ينخفض عند دفع المبلغ أو عكس التسوية.",statementAr:"التزام في المركز المالي ومصروف في قائمة الدخل",documentsAr:"فاتورة متأخرة، عقد، كشف تقديري، ورقة تسوية",cycleAr:"تحقق الخدمة ← تقدير الاستحقاق ← قيد تسوية ← استلام الفاتورة ← سداد وإقفال",exampleAr:"كهرباء مستحقة: من حـ/ الكهرباء إلى حـ/ المصروفات المستحقة." }),
  item({ code:"2130",nameAr:"ضريبة القيمة المضافة المستحقة",nameEn:"VAT payable",category:"liabilities",categoryAr:"التزام ضريبي",normalAr:"دائنة",normalEn:"Credit",increaseSideAr:"دائن",decreaseSideAr:"مدين",increaseEffectAr:"يزيد صافي الضريبة المستحقة للجهة الضريبية.",decreaseEffectAr:"ينخفض بالسداد أو الخصم المسموح وفق المستندات والقواعد المطبقة.",statementAr:"قائمة المركز المالي — التزامات متداولة",documentsAr:"فواتير ضريبية، إقرار، إشعار سداد",cycleAr:"فاتورة بيع/شراء ← فصل الضريبة ← تجميع الفترة ← مراجعة الإقرار ← سداد/ترحيل",exampleAr:"ضريبة المبيعات تُسجل دائنة، وضريبة المدخلات تُخصم وفق المعالجة المطبقة." }),
  item({ code:"2200",nameAr:"القروض",nameEn:"Loans payable",category:"liabilities",categoryAr:"التزام مالي",normalAr:"دائنة",normalEn:"Credit",increaseSideAr:"دائن",decreaseSideAr:"مدين",increaseEffectAr:"يزيد التمويل والنقدية، ويزيد الالتزام دون زيادة الإيراد.",decreaseEffectAr:"سداد أصل القرض يخفض البنك والالتزام؛ الفائدة مصروف منفصل.",statementAr:"قائمة المركز المالي — متداول/غير متداول حسب الاستحقاق",documentsAr:"عقد قرض، كشف بنك، جدول أقساط، إشعار خصم",cycleAr:"عقد واعتماد ← استلام التمويل ← إثبات القرض ← فصل أصل/فائدة ← سداد ومطابقة",exampleAr:"استلام قرض: من حـ/ البنك إلى حـ/ القرض." }),
  item({ code:"3100",nameAr:"رأس المال",nameEn:"Owner capital",category:"equity",categoryAr:"حقوق ملكية",normalAr:"دائنة",normalEn:"Credit",increaseSideAr:"دائن",decreaseSideAr:"مدين",increaseEffectAr:"يزيد صافي حقوق المالك وتمويل المنشأة، ولا يُعد إيرادًا.",decreaseEffectAr:"ينخفض عند رد رأس المال أو التسويات المعتمدة.",statementAr:"قائمة المركز المالي — حقوق الملكية",documentsAr:"عقد تأسيس، قرار شركاء، إشعار إيداع",cycleAr:"قرار تمويل ← إيداع/نقل أصل ← قيد رأس المال ← تحديث سجل الشركاء ← المركز المالي",exampleAr:"إيداع المالك 100,000: من حـ/ البنك إلى حـ/ رأس المال." }),
  item({ code:"3110",nameAr:"المسحوبات",nameEn:"Owner drawings",category:"contra",categoryAr:"حساب مقابل لحقوق الملكية",normalAr:"مدينة",normalEn:"Debit",increaseSideAr:"مدين",decreaseSideAr:"دائن",increaseEffectAr:"تخفض حقوق الملكية لكنها ليست مصروف تشغيل.",decreaseEffectAr:"تنخفض عند إقفالها في رأس المال.",statementAr:"تُخصم من حقوق الملكية",documentsAr:"طلب سحب مالك، سند صرف، تحويل",cycleAr:"طلب/إقرار سحب ← صرف ← قيد مسحوبات ← مراجعة ← إقفال في حقوق الملكية",exampleAr:"سحب المالك نقدًا: من حـ/ المسحوبات إلى حـ/ الصندوق." }),
  item({ code:"4100",nameAr:"إيراد المبيعات",nameEn:"Sales revenue",category:"revenue",categoryAr:"إيراد",normalAr:"دائنة",normalEn:"Credit",increaseSideAr:"دائن",decreaseSideAr:"مدين",increaseEffectAr:"يزيد الإيراد والربح وحقوق الملكية، مع زيادة نقدية أو عميل.",decreaseEffectAr:"ينخفض بالمردودات أو الخصومات أو التصحيح.",statementAr:"قائمة الدخل — الإيرادات",documentsAr:"طلب بيع، إذن تسليم، فاتورة بيع، سند قبض",cycleAr:"طلب عميل ← موافقة ائتمانية ← تسليم ← فاتورة ← قيد بيع ← تحصيل ← تقارير",exampleAr:"بيع نقدي: من حـ/ الصندوق إلى حـ/ المبيعات." }),
  item({ code:"4200",nameAr:"إيرادات خدمات",nameEn:"Service revenue",category:"revenue",categoryAr:"إيراد",normalAr:"دائنة",normalEn:"Credit",increaseSideAr:"دائن",decreaseSideAr:"مدين",increaseEffectAr:"يزيد ربح الفترة عند تقديم الخدمة واستحقاق المقابل.",decreaseEffectAr:"ينخفض عند إلغاء الخدمة أو إصدار إشعار دائن.",statementAr:"قائمة الدخل — الإيرادات",documentsAr:"عقد، أمر عمل، محضر إنجاز، فاتورة خدمة",cycleAr:"تعاقد ← تنفيذ ← اعتماد إنجاز ← فاتورة ← قيد إيراد ← تحصيل",exampleAr:"خدمة آجل: من حـ/ العميل إلى حـ/ إيراد الخدمات." }),
  item({ code:"5100",nameAr:"تكلفة المبيعات",nameEn:"Cost of sales",category:"expenses",categoryAr:"تكلفة مباشرة",normalAr:"مدينة",normalEn:"Debit",increaseSideAr:"مدين",decreaseSideAr:"دائن",increaseEffectAr:"تزيد تكلفة البضاعة المباعة وتخفض مجمل الربح والمخزون.",decreaseEffectAr:"تنخفض مع مردودات المبيعات أو تصحيح التكلفة.",statementAr:"قائمة الدخل — قبل مجمل الربح",documentsAr:"فاتورة بيع، إذن صرف مخزني، بطاقة صنف",cycleAr:"بيع وتسليم ← صرف مخزون ← احتساب تكلفة ← قيد تكلفة ومخزون ← مجمل الربح",exampleAr:"من حـ/ تكلفة المبيعات إلى حـ/ المخزون." }),
  item({ code:"5200",nameAr:"مصروف الرواتب والأجور",nameEn:"Payroll expense",category:"expenses",categoryAr:"مصروف تشغيلي",normalAr:"مدينة",normalEn:"Debit",increaseSideAr:"مدين",decreaseSideAr:"دائن",increaseEffectAr:"يزيد المصروف ويخفض الربح وحقوق الملكية.",decreaseEffectAr:"ينخفض عند عكس استحقاق زائد أو استرداد.",statementAr:"قائمة الدخل — مصروفات تشغيلية",documentsAr:"كشف حضور، مسير رواتب، اعتماد، تحويل بنكي",cycleAr:"حضور واستحقاقات ← إعداد المسير ← مراجعة واعتماد ← قيد رواتب ← دفع ← تسوية الالتزامات",exampleAr:"إثبات رواتب مستحقة: من حـ/ الرواتب إلى حـ/ رواتب مستحقة." }),
  item({ code:"5210",nameAr:"مصروف الإيجار",nameEn:"Rent expense",category:"expenses",categoryAr:"مصروف تشغيلي",normalAr:"مدينة",normalEn:"Debit",increaseSideAr:"مدين",decreaseSideAr:"دائن",increaseEffectAr:"يزيد مصروف الفترة ويخفض الربح.",decreaseEffectAr:"ينخفض عند عكس تسجيل خاطئ أو تحويل جزء لمدفوع مقدمًا.",statementAr:"قائمة الدخل — مصروفات تشغيلية",documentsAr:"عقد إيجار، فاتورة، سند دفع",cycleAr:"عقد ← استحقاق الفترة ← فاتورة/تسوية ← اعتماد ← دفع ← قيد مصروف",exampleAr:"دفع إيجار الشهر: من حـ/ الإيجار إلى حـ/ البنك." }),
  item({ code:"5220",nameAr:"مصروف الكهرباء والمرافق",nameEn:"Utilities expense",category:"expenses",categoryAr:"مصروف تشغيلي",normalAr:"مدينة",normalEn:"Debit",increaseSideAr:"مدين",decreaseSideAr:"دائن",increaseEffectAr:"يزيد تكلفة التشغيل ويخفض الربح.",decreaseEffectAr:"ينخفض بالتصحيح أو رد المبلغ.",statementAr:"قائمة الدخل — مصروفات تشغيلية",documentsAr:"فاتورة مرافق، قراءة عداد، سند سداد",cycleAr:"استهلاك ← فاتورة/تقدير ← اعتماد ← قيد مصروف/استحقاق ← سداد",exampleAr:"فاتورة غير مدفوعة: من حـ/ المرافق إلى حـ/ مصروفات مستحقة." }),
  item({ code:"5230",nameAr:"مصروف الأدوات المكتبية",nameEn:"Office supplies expense",category:"expenses",categoryAr:"مصروف إداري",normalAr:"مدينة",normalEn:"Debit",increaseSideAr:"مدين",decreaseSideAr:"دائن",increaseEffectAr:"يزيد المصروف الإداري ويخفض الربح، إذا كانت الأدوات مستهلكة وقيمتها غير جوهرية.",decreaseEffectAr:"ينخفض عند رد المشتريات أو تصحيح التصنيف.",statementAr:"قائمة الدخل — مصروفات عمومية وإدارية",documentsAr:"طلب شراء، فاتورة، إذن استلام، عهدة أو سند صرف",cycleAr:"طلب أدوات ← موافقة ← شراء/عهدة ← فاتورة واستلام ← تسوية ← قيد مصروف ← حفظ المستند",exampleAr:"شراء أقلام من عهدة: من حـ/ أدوات مكتبية إلى حـ/ عهد الموظف." }),
  item({ code:"5240",nameAr:"مصروف الصيانة",nameEn:"Maintenance expense",category:"expenses",categoryAr:"مصروف تشغيلي",normalAr:"مدينة",normalEn:"Debit",increaseSideAr:"مدين",decreaseSideAr:"دائن",increaseEffectAr:"يزيد المصروف ويخفض الربح إذا حافظ على الأصل دون زيادة جوهرية في منفعته.",decreaseEffectAr:"ينخفض عند رد أو تصحيح؛ التحسين الجوهري قد يعاد تصنيفه أصلًا.",statementAr:"قائمة الدخل — مصروفات تشغيلية",documentsAr:"طلب صيانة، أمر عمل، محضر إنجاز، فاتورة",cycleAr:"بلاغ عطل ← طلب واعتماد ← أمر صيانة ← إنجاز وفحص ← فاتورة ← قيد ودفع",exampleAr:"صيانة عادية نقدًا: من حـ/ الصيانة إلى حـ/ الصندوق." }),
  item({ code:"5250",nameAr:"مصروف الإهلاك",nameEn:"Depreciation expense",category:"expenses",categoryAr:"مصروف غير نقدي",normalAr:"مدينة",normalEn:"Debit",increaseSideAr:"مدين",decreaseSideAr:"دائن",increaseEffectAr:"يزيد مصروف الفترة ويخفض الربح وصافي قيمة الأصل دون خروج نقدية وقت القيد.",decreaseEffectAr:"ينخفض عند تصحيح تقدير زائد.",statementAr:"قائمة الدخل؛ ويقابله مجمع إهلاك في المركز المالي",documentsAr:"سجل أصول، سياسة إهلاك، كشف احتساب",cycleAr:"سجل الأصول ← احتساب آلي ← مراجعة ← قيد دوري ← القوائم والإقفال",exampleAr:"من حـ/ مصروف الإهلاك إلى حـ/ مجمع الإهلاك." }),
  item({ code:"5260",nameAr:"مصروفات وعمولات بنكية",nameEn:"Bank charges",category:"expenses",categoryAr:"مصروف تمويلي/إداري",normalAr:"مدينة",normalEn:"Debit",increaseSideAr:"مدين",decreaseSideAr:"دائن",increaseEffectAr:"تزيد المصروفات وتخفض الربح والبنك.",decreaseEffectAr:"تنخفض عند رد العمولة من البنك.",statementAr:"قائمة الدخل — مصروفات مالية أو إدارية",documentsAr:"كشف بنك، إشعار خصم أو إضافة",cycleAr:"ظهور بكشف البنك ← تحديد الحركة ← قيد العمولة ← مطابقة البنك ← التقارير",exampleAr:"من حـ/ عمولات بنكية إلى حـ/ البنك." }),
];

const canonicalCodes: Record<string, string> = {
  "Cash on hand":"1100", Bank:"1110", "Accounts receivable":"1120", Inventory:"1200", "Prepaid expenses":"1140",
  "Property, plant and equipment":"1300", "Accumulated depreciation":"1390", "Accounts payable":"2100", "Accrued expenses":"2210",
  "VAT payable":"2201", "Loans payable":"2300", "Owner capital":"3100", "Owner drawings":"3200", "Sales revenue":"4100",
  "Service revenue":"4200", "Cost of sales":"5010", "Payroll expense":"5200", "Rent expense":"5100", "Utilities expense":"5110",
  "Office supplies expense":"5120", "Maintenance expense":"5130", "Depreciation expense":"5300", "Bank charges":"5600",
};

const normalizedCore = coreAccountLearningGuide.map((account) => ({ ...account, code: canonicalCodes[account.nameEn] || account.code }));
const guidedCodes = new Set(normalizedCore.map((account) => account.code)), guidedNames = new Set(normalizedCore.map((account) => account.nameEn.toLowerCase()));
const genericCategory = (type: string): AccountGuideCategory => type === "asset" ? "assets" : type === "liability" ? "liabilities" : type === "equity" ? "equity" : type === "revenue" ? "revenue" : "expenses";
const genericCategoryAr = (type: string) => type === "asset" ? "أصل" : type === "liability" ? "التزام" : type === "equity" ? "حقوق ملكية" : type === "revenue" ? "إيراد" : "مصروف أو تكلفة";
const genericStatement = (type: string) => type === "asset" ? "قائمة المركز المالي — الأصول" : type === "liability" ? "قائمة المركز المالي — الالتزامات" : type === "equity" ? "قائمة المركز المالي — حقوق الملكية" : type === "revenue" ? "قائمة الدخل — الإيرادات" : "قائمة الدخل — المصروفات والتكاليف";
const genericIncrease = (type: string) => type === "asset" ? "يزيد قيمة أصول المنشأة، وقد يزيد السيولة أو الحقوق أو الموارد طويلة الأجل." : type === "liability" ? "يزيد ما على المنشأة للغير وإجمالي الالتزامات." : type === "equity" ? "يزيد حقوق الملاك وصافي تمويل المنشأة." : type === "revenue" ? "يزيد إيراد الفترة والربح وحقوق الملكية." : "يزيد تكلفة أو مصروف الفترة ويخفض الربح وحقوق الملكية.";
const genericDecrease = (type: string) => type === "asset" ? "يخفض قيمة الأصل وإجمالي الأصول أو ينقل قيمته إلى أصل أو مصروف آخر." : type === "liability" ? "يخفض الالتزام عند السداد أو التسوية أو الإلغاء." : type === "equity" ? "يخفض حقوق الملاك عند التوزيع أو السحب أو التسوية." : type === "revenue" ? "يخفض الإيراد والربح عند الرد أو التصحيح." : "يخفض المصروف عند العكس أو الرد أو إعادة التصنيف.";

const supplementalAccounts: AccountLearningGuideItem[] = defaultAccounts.filter((account) => account.allowPosting && account.active && !guidedCodes.has(account.code) && !guidedNames.has(account.nameEn.toLowerCase())).map((account) => {
  const debit = account.normalBalance === "debit", type = account.type;
  return { code:account.code, nameAr:account.nameAr, nameEn:account.nameEn, category:genericCategory(type), categoryAr:genericCategoryAr(type), normalAr:debit?"مدينة":"دائنة", normalEn:debit?"Debit":"Credit", increaseSideAr:debit?"مدين":"دائن", decreaseSideAr:debit?"دائن":"مدين", increaseEffectAr:genericIncrease(type), decreaseEffectAr:genericDecrease(type), statementAr:genericStatement(type), documentsAr:"المستند الأصلي المؤيد للحركة، نموذج الاعتماد، وكشف أو سجل الحساب", cycleAr:"مستند مؤيد ← مراجعة واعتماد ← تحليل الحساب ← قيد اليومية ← الأستاذ ← ميزان المراجعة ← القوائم", exampleAr:`عند زيادة ${account.nameAr} يُسجل في جهة طبيعته ${debit?"المدينة":"الدائنة"}، وعند نقصه يُسجل في الجهة العكسية.` };
});

type EducationalSeed = [code: string, nameAr: string, nameEn: string, type: "asset" | "liability" | "equity" | "revenue" | "expense", category?: AccountGuideCategory, normalBalance?: "debit" | "credit"];

const educationalSeeds: EducationalSeed[] = [
  ["1101", "العهدة النقدية المستديمة", "Petty cash imprest", "asset"],
  ["1102", "نقدية بالطريق", "Cash in transit", "asset"],
  ["1111", "حسابات بنكية جارية", "Current bank accounts", "asset"],
  ["1112", "ودائع بنكية قصيرة الأجل", "Short-term bank deposits", "asset"],
  ["1121", "عملاء محليون", "Domestic receivables", "asset"],
  ["1122", "شيكات آجلة التحصيل", "Post-dated cheques receivable", "asset"],
  ["1123", "أوراق قبض برسم التحصيل", "Notes receivable under collection", "asset"],
  ["1131", "دفعات مقدمة للموردين", "Advances to suppliers", "asset"],
  ["1132", "قروض وسلف الموظفين", "Employee loans", "asset"],
  ["1141", "تأمين مدفوع مقدمًا", "Prepaid insurance", "asset"],
  ["1142", "إيجار مدفوع مقدمًا", "Prepaid rent", "asset"],
  ["1160", "تأمينات لدى الغير", "Refundable security deposits", "asset"],
  ["1211", "مخزون مواد خام", "Raw materials inventory", "asset"],
  ["1212", "إنتاج تحت التشغيل", "Work in progress inventory", "asset"],
  ["1213", "مخزون إنتاج تام", "Finished goods inventory", "asset"],
  ["1214", "مخزون قطع غيار", "Spare parts inventory", "asset"],
  ["1350", "الأثاث والتجهيزات", "Furniture and fixtures", "asset"],
  ["1360", "أجهزة الحاسب والأنظمة", "Computer equipment", "asset"],
  ["1370", "تحسينات على مبانٍ مستأجرة", "Leasehold improvements", "asset"],
  ["1380", "مشروعات تحت التنفيذ", "Construction in progress", "asset"],
  ["1400", "الأصول غير الملموسة", "Intangible assets", "asset"],
  ["1410", "البرامج والتراخيص", "Software and licenses", "asset"],
  ["1420", "العلامات التجارية", "Trademarks", "asset"],
  ["1430", "الشهرة", "Goodwill", "asset"],

  ["2101", "موردون محليون", "Domestic trade payables", "liability"],
  ["2111", "أوراق الدفع", "Notes payable", "liability"],
  ["2121", "دفعات مقدمة من العملاء", "Customer advances", "liability"],
  ["2122", "إيرادات محصلة مقدمًا", "Unearned revenue", "liability"],
  ["2203", "ضريبة كسب العمل المستحقة", "Payroll tax payable", "liability"],
  ["2204", "تأمينات اجتماعية مستحقة", "Social insurance payable", "liability"],
  ["2211", "رواتب وأجور مستحقة", "Accrued payroll", "liability"],
  ["2212", "فوائد مستحقة", "Accrued interest", "liability"],
  ["2220", "قروض قصيرة الأجل", "Short-term loans", "liability"],
  ["2221", "الجزء الجاري من القروض طويلة الأجل", "Current portion of long-term debt", "liability"],
  ["2240", "توزيعات أرباح مستحقة", "Dividends payable", "liability"],
  ["2250", "تأمينات محتجزة للغير", "Deposits held from others", "liability"],
  ["2310", "التزامات عقود الإيجار", "Lease liabilities", "liability"],
  ["2320", "أوراق دفع طويلة الأجل", "Long-term notes payable", "liability"],
  ["2330", "مخصص مكافأة نهاية الخدمة", "End-of-service benefit provision", "liability"],
  ["2340", "مخصص ضمان المنتجات", "Warranty provision", "liability"],

  ["3101", "رأس المال المدفوع", "Paid-in capital", "equity"],
  ["3120", "علاوة إصدار", "Additional paid-in capital", "equity"],
  ["3130", "الاحتياطي القانوني", "Legal reserve", "equity"],
  ["3140", "احتياطيات أخرى", "Other reserves", "equity"],
  ["3160", "أرباح العام الحالي", "Current-year profit", "equity"],
  ["3210", "توزيعات الأرباح", "Profit distributions", "equity", "contra", "debit"],

  ["4110", "مبيعات محلية", "Domestic sales revenue", "revenue"],
  ["4120", "مبيعات تصدير", "Export sales revenue", "revenue"],
  ["4130", "مبيعات فروع", "Branch sales revenue", "revenue"],
  ["4210", "إيراد استشارات", "Consulting revenue", "revenue"],
  ["4220", "إيراد صيانة", "Maintenance revenue", "revenue"],
  ["4230", "إيراد اشتراكات", "Subscription revenue", "revenue"],
  ["4240", "إيراد عمولات", "Commission revenue", "revenue"],
  ["4910", "أرباح بيع أصول", "Gain on disposal of assets", "revenue"],
  ["4920", "أرباح فروق عملة", "Foreign exchange gain", "revenue"],
  ["4930", "إيرادات إيجار", "Rental income", "revenue"],

  ["5020", "نقل ومناولة المشتريات", "Freight-in and purchasing handling", "expense"],
  ["5030", "رسوم جمركية على المشتريات", "Import duties", "expense"],
  ["5101", "إيجار المخازن", "Warehouse rent", "expense"],
  ["5140", "مصروف التأمين", "Insurance expense", "expense"],
  ["5150", "مصروف الاتصالات والإنترنت", "Telephone and internet expense", "expense"],
  ["5160", "مصروف النقل والانتقالات", "Transportation expense", "expense"],
  ["5170", "مصروف السفر والإقامة", "Travel and accommodation expense", "expense"],
  ["5180", "مصروف الضيافة والاجتماعات", "Hospitality and meetings expense", "expense"],
  ["5190", "مصروف الأمن والنظافة", "Security and cleaning expense", "expense"],
  ["5211", "الحوافز والمكافآت", "Bonuses and incentives", "expense"],
  ["5221", "حصة المنشأة في التأمينات", "Employer social insurance expense", "expense"],
  ["5231", "مصروف التدريب والتطوير", "Training and development expense", "expense"],
  ["5241", "مصروف التوظيف", "Recruitment expense", "expense"],
  ["5310", "مصروف الإطفاء", "Amortization expense", "expense"],
  ["5410", "عمولات البيع", "Sales commissions", "expense"],
  ["5510", "مصروفات قانونية", "Legal fees", "expense"],
  ["5520", "مصروفات المراجعة", "Audit fees", "expense"],
  ["5610", "مصروف الفوائد", "Interest expense", "expense"],
  ["5620", "خسائر فروق العملة", "Foreign exchange loss", "expense"],
  ["5700", "مصروف الديون المشكوك فيها", "Bad debt expense", "expense"],
  ["5800", "ضرائب ورسوم حكومية", "Taxes and government fees", "expense"],
  ["5900", "مصروفات وتبرعات أخرى", "Other expenses and donations", "expense"],

  // Cash, receivables, contracts, and investments
  ["1103", "شيكات تحت التحصيل", "Cheques under collection", "asset"],
  ["1104", "نقدية مقيدة", "Restricted cash", "asset"],
  ["1113", "ودائع لأجل", "Time deposits", "asset"],
  ["1114", "محافظ ومدفوعات إلكترونية", "Digital wallets and e-payments", "asset"],
  ["1124", "عملاء أجانب", "Foreign receivables", "asset"],
  ["1125", "عملاء أطراف ذات علاقة", "Related-party receivables", "asset"],
  ["1126", "إيرادات مستحقة", "Accrued revenue", "asset"],
  ["1127", "ذمم مدينة أخرى", "Other receivables", "asset"],
  ["1128", "أصول عقود", "Contract assets", "asset"],
  ["1133", "سلف مقاولين", "Contractor advances", "asset"],
  ["1134", "اعتمادات مستندية", "Letters of credit", "asset"],
  ["1135", "غطاء خطابات ضمان", "Guarantee letter margin", "asset"],
  ["1143", "اشتراكات مدفوعة مقدمًا", "Prepaid subscriptions", "asset"],
  ["1144", "ضرائب مدفوعة مقدمًا", "Prepaid taxes", "asset"],
  ["1151", "ضريبة قيمة مضافة مدخلات", "Input VAT", "asset"],
  ["1152", "ضريبة خصم وتحصيل لدى الغير", "Withholding tax receivable", "asset"],
  ["1170", "استثمارات قصيرة الأجل", "Short-term investments", "asset"],
  ["1180", "أصول محتفظ بها للبيع", "Assets held for sale", "asset"],
  ["1220", "بضاعة بالطريق", "Goods in transit", "asset"],
  ["1230", "مخزون تعبئة وتغليف", "Packing materials inventory", "asset"],
  ["1240", "مخزون مطاعم وأغذية", "Food and beverage inventory", "asset"],
  ["1310", "أراضٍ", "Land", "asset"],
  ["1320", "مبانٍ", "Buildings", "asset"],
  ["1330", "آلات ومعدات", "Machinery and equipment", "asset"],
  ["1340", "سيارات ووسائل نقل", "Vehicles", "asset"],
  ["1440", "حقوق استخدام أصول", "Right-of-use assets", "asset"],
  ["1450", "استثمارات طويلة الأجل", "Long-term investments", "asset"],
  ["1460", "استثمارات في شركات تابعة", "Investments in subsidiaries", "asset"],
  ["1470", "أصل ضريبي مؤجل", "Deferred tax asset", "asset"],

  // Trade, payroll, tax, contract, and long-term obligations
  ["2102", "موردون أجانب", "Foreign trade payables", "liability"],
  ["2103", "موردون أطراف ذات علاقة", "Related-party payables", "liability"],
  ["2104", "مقاولو الباطن", "Subcontractor payables", "liability"],
  ["2123", "التزامات عقود", "Contract liabilities", "liability"],
  ["2124", "أرصدة دائنة أخرى", "Other payables", "liability"],
  ["2131", "ضريبة قيمة مضافة مخرجات", "Output VAT", "liability"],
  ["2132", "ضريبة خصم وتحصيل مستحقة", "Withholding tax payable", "liability"],
  ["2133", "ضريبة دخل مستحقة", "Income tax payable", "liability"],
  ["2134", "ضريبة عقارية مستحقة", "Property tax payable", "liability"],
  ["2213", "إجازات مستحقة للموظفين", "Accrued employee leave", "liability"],
  ["2214", "عمولات ومكافآت مستحقة", "Accrued bonuses and commissions", "liability"],
  ["2230", "مبالغ مستحقة للموظفين", "Employee reimbursements payable", "liability"],
  ["2260", "حسابات جارية للشركاء", "Partners current accounts", "liability"],
  ["2270", "إيرادات منح مؤجلة", "Deferred grant income", "liability"],
  ["2350", "قروض طويلة الأجل", "Long-term loans", "liability"],
  ["2360", "التزام ضريبي مؤجل", "Deferred tax liability", "liability"],
  ["2370", "مخصص قضايا ومطالبات", "Legal claims provision", "liability"],
  ["2380", "مخصص إزالة وإعادة موقع", "Asset retirement obligation", "liability"],

  // Equity and comprehensive income
  ["3150", "أرباح محتجزة", "Retained earnings", "equity"],
  ["3170", "فروق ترجمة عملات أجنبية", "Foreign currency translation reserve", "equity"],
  ["3180", "احتياطي إعادة تقييم", "Revaluation reserve", "equity"],
  ["3190", "حقوق غير مسيطرة", "Non-controlling interests", "equity"],

  // Sector-specific and non-operating revenue
  ["4250", "إيراد أتعاب مهنية", "Professional fees revenue", "revenue"],
  ["4260", "إيراد مقاولات ومستخلصات", "Contracting revenue", "revenue"],
  ["4270", "إيراد عيادات وخدمات طبية", "Medical services revenue", "revenue"],
  ["4280", "إيراد غرف وضيافة", "Rooms and hospitality revenue", "revenue"],
  ["4290", "إيراد تجارة إلكترونية", "E-commerce revenue", "revenue"],
  ["4310", "إيراد فوائد", "Interest income", "revenue"],
  ["4320", "إيراد توزيعات أرباح", "Dividend income", "revenue"],
  ["4330", "تبرعات ومنح", "Donations and grants income", "revenue"],
  ["4340", "إيراد تقييم استثمارات", "Investment fair value gain", "revenue"],

  // Manufacturing, contracting, selling, administration, and finance costs
  ["5040", "أجور صناعية مباشرة", "Direct manufacturing labor", "expense"],
  ["5050", "تكاليف صناعية غير مباشرة", "Manufacturing overhead", "expense"],
  ["5060", "هالك وفاقد إنتاج", "Production scrap and waste", "expense"],
  ["5070", "تكلفة خدمات طبية", "Medical service costs", "expense"],
  ["5080", "تكلفة أغذية ومشروبات", "Food and beverage cost", "expense"],
  ["5090", "تكلفة عقود ومقاولات", "Contract costs", "expense"],
  ["5320", "مصروف إيجار أصول حق استخدام", "Right-of-use asset depreciation", "expense"],
  ["5420", "مصروف الإعلان والتسويق الرقمي", "Advertising and digital marketing", "expense"],
  ["5430", "توصيل وشحن المبيعات", "Delivery and outbound freight", "expense"],
  ["5440", "رسوم منصات إلكترونية", "Marketplace platform fees", "expense"],
  ["5530", "أتعاب محاسبية واستشارية", "Accounting and consulting fees", "expense"],
  ["5540", "مصروف البرمجيات السحابية", "Cloud software expense", "expense"],
  ["5550", "مصروف تراخيص واشتراكات", "Licenses and subscriptions expense", "expense"],
  ["5560", "مصروفات مجلس الإدارة", "Board expenses", "expense"],
  ["5630", "تكلفة تمويل عقود الإيجار", "Lease finance cost", "expense"],
  ["5640", "خسائر ائتمانية متوقعة", "Expected credit loss expense", "expense"],
  ["5650", "خسائر بيع أصول", "Loss on disposal of assets", "expense"],
  ["5660", "خسائر تقييم استثمارات", "Investment fair value loss", "expense"],
  ["5810", "ضريبة الدخل الجارية", "Current income tax expense", "expense"],
  ["5820", "ضريبة الدخل المؤجلة", "Deferred income tax expense", "expense"],
  ["5910", "مصروفات سنوات سابقة", "Prior-period expenses", "expense"],

  ["1129", "مخصص خسائر ائتمانية متوقعة", "Allowance for expected credit losses", "asset", "contra", "credit"],
  ["1391", "مجمع إطفاء الأصول غير الملموسة", "Accumulated amortization", "asset", "contra", "credit"],
  ["4191", "خصم مسموح به على المبيعات", "Sales discounts", "revenue", "contra", "debit"],
  ["4192", "مردودات مبيعات تفصيلية", "Detailed sales returns", "revenue", "contra", "debit"],
  ["5001", "مردودات ومسموحات المشتريات", "Purchase returns and allowances", "expense", "contra", "credit"],
];

const existingGuideCodes = new Set([...normalizedCore, ...supplementalAccounts].map((account) => account.code));
const educationalAccounts: AccountLearningGuideItem[] = educationalSeeds.filter(([code]) => !existingGuideCodes.has(code)).map(([code, nameAr, nameEn, type, categoryOverride, normalBalance]) => {
  const debit = normalBalance ? normalBalance === "debit" : type === "asset" || type === "expense";
  const category = categoryOverride || genericCategory(type);
  const contra = category === "contra";
  return {
    code, nameAr, nameEn, category,
    categoryAr: contra ? "حساب مقابل" : genericCategoryAr(type),
    normalAr: debit ? "مدينة" : "دائنة", normalEn: debit ? "Debit" : "Credit",
    increaseSideAr: debit ? "مدين" : "دائن", decreaseSideAr: debit ? "دائن" : "مدين",
    increaseEffectAr: contra ? "زيادة الحساب المقابل تخفض صافي قيمة الحساب الرئيسي أو صافي الإيراد أو التكلفة المرتبطة به." : genericIncrease(type),
    decreaseEffectAr: contra ? "انخفاض الحساب المقابل يرفع صافي قيمة الحساب الرئيسي أو يعكس جزءًا من التخفيض السابق." : genericDecrease(type),
    statementAr: genericStatement(type),
    documentsAr: "المستند المؤيد للحركة، نموذج الاعتماد، العقد أو الفاتورة، وكشف تحليل الحساب",
    cycleAr: "مستند مؤيد ← مراجعة واعتماد ← تحديد طبيعة الحساب ← قيد اليومية ← الأستاذ ← ميزان المراجعة ← القوائم المالية",
    exampleAr: `عند زيادة ${nameAr} يُسجل في الجانب ${debit ? "المدين" : "الدائن"}، وعند انخفاضه يُسجل في الجانب العكسي مع شرح سبب الحركة.`,
  };
});

export const accountLearningGuide: AccountLearningGuideItem[] = [...normalizedCore, ...supplementalAccounts, ...educationalAccounts].sort((a,b) => a.code.localeCompare(b.code, "en"));

export const accountGuideCategories = [
  { id:"assets", ar:"الأصول", en:"Assets" },
  { id:"liabilities", ar:"الالتزامات", en:"Liabilities" },
  { id:"equity", ar:"حقوق الملكية", en:"Equity" },
  { id:"revenue", ar:"الإيرادات", en:"Revenue" },
  { id:"expenses", ar:"المصروفات والتكاليف", en:"Expenses" },
  { id:"contra", ar:"الحسابات المقابلة", en:"Contra accounts" },
] as const;

export function findAccountLearningGuide(arName: string, enName: string) {
  const normalize = (value: string) => value.trim().toLowerCase();
  return accountLearningGuide.find((account) => normalize(account.nameAr) === normalize(arName) || normalize(account.nameEn) === normalize(enName))
    ?? accountLearningGuide.find((account) => normalize(arName).includes(normalize(account.nameAr)) || normalize(account.nameAr).includes(normalize(arName)));
}
import { defaultAccounts } from "@/data/accounts";
