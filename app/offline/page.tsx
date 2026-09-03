import Image from "next/image";
import Link from "next/link";

export default function OfflinePage() {
  return <main className="grid min-h-screen place-items-center bg-[#eef3f8] p-5" dir="auto"><section className="max-w-lg rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-xl"><Image src="/finora-icon-192.png" alt="FINORA" width={80} height={80} className="mx-auto rounded-3xl"/><h1 className="mt-5 text-2xl">أنت تعمل حاليًا على النسخة المحلية</h1><p className="mt-3 leading-7 text-slate-600">بيانات هذا الجهاز متاحة. بعض الصفحات تحتاج اتصالًا لإعادة تحميل ملفاتها، ولا توجد مزامنة سحابية مفعلة.</p><p className="mt-4 text-sm text-slate-500">You are offline. Data already stored on this device remains available; cloud sync is not enabled.</p><Link className="btn btn-primary mt-6" href="/ar/service-point">العودة إلى FINORA</Link></section></main>;
}
