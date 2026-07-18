import { roundCurrency } from "./calculations";
import { generateJournalEntry } from "@/rules";
import type {
  DecisionAlternative,
  DecisionSimulation,
  DecisionSimulationInput,
  FinancialStatementImpact,
  ScenarioHorizons,
  TransactionInput,
} from "@/types";

const horizonKeys: (keyof ScenarioHorizons)[] = ["now", "day7", "day30", "day90"];

function transactionType(type: DecisionSimulationInput["decisionType"], payment: "cash" | "credit") {
  if (type === "sale") return payment === "cash" ? "cash-sale" : "credit-sale";
  if (type === "purchase") return payment === "cash" ? "cash-purchase" : "credit-purchase";
  if (type === "fixed-asset") return "fixed-asset-purchase";
  return "maintenance-expense";
}

function cashAtDue(amount: number, days: number, direction: 1 | -1): ScenarioHorizons {
  const signed = roundCurrency(amount * direction);
  return {
    now: 0,
    day7: days <= 7 ? signed : 0,
    day30: days <= 30 ? signed : 0,
    day90: days <= 90 ? signed : 0,
  };
}

function immediateCash(amount: number, direction: 1 | -1): ScenarioHorizons {
  const signed = roundCurrency(amount * direction);
  return { now: signed, day7: signed, day30: signed, day90: signed };
}

function addHorizons(...values: ScenarioHorizons[]): ScenarioHorizons {
  return horizonKeys.reduce((result, key) => ({ ...result, [key]: roundCurrency(values.reduce((sum, value) => sum + value[key], 0)) }), { now: 0, day7: 0, day30: 0, day90: 0 });
}

function addImpact(entries: TransactionInput[]): FinancialStatementImpact {
  const impacts = entries.map((entry) => generateJournalEntry(entry).financialStatementImpact);
  const sum = (key: keyof FinancialStatementImpact) => roundCurrency(impacts.reduce((total, impact) => total + (impact[key] || 0), 0));
  return { assets: sum("assets"), liabilities: sum("liabilities"), equity: sum("equity"), revenue: sum("revenue"), expenses: sum("expenses"), profit: sum("profit"), cash: sum("cash"), inventory: sum("inventory"), receivables: sum("receivables"), payables: sum("payables") };
}

function makeEntry(input: DecisionSimulationInput, payment: "cash" | "credit", amount: number, noteAr: string): TransactionInput {
  return {
    type: transactionType(input.decisionType, payment),
    amount: roundCurrency(amount),
    currency: input.currency,
    paymentMethod: payment === "credit" ? "credit" : (input.paymentAccountCode === "1100" ? "cash" : "bank"),
    paymentAccountCode: payment === "cash" ? input.paymentAccountCode : undefined,
    paymentAccountNameAr: payment === "cash" ? input.paymentAccountNameAr : undefined,
    paymentAccountNameEn: payment === "cash" ? input.paymentAccountNameEn : undefined,
    vatEnabled: input.vatRate > 0,
    vatRate: input.vatRate,
    notes: noteAr,
  };
}

export function simulateDecision(input: DecisionSimulationInput): DecisionSimulation {
  if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error("Amount must be greater than zero");
  if (input.vatRate < 0 || input.vatRate > 100) throw new Error("VAT rate must be between 0 and 100");
  const direction: 1 | -1 = input.decisionType === "sale" ? 1 : -1;
  const gross = (net: number) => roundCurrency(net * (1 + input.vatRate / 100));
  const discountedNet = roundCurrency(input.amount * (1 - input.cashDiscountRate / 100));
  const halfCashNet = roundCurrency(input.amount / 2 * (1 - input.cashDiscountRate / 100));
  const halfCreditNet = roundCurrency(input.amount / 2);
  const nounAr = input.decisionType === "sale" ? "التحصيل" : "السداد";
  const nounEn = input.decisionType === "sale" ? "collection" : "payment";

  const definitions = [
    {
      id: "cash" as const,
      titleAr: "نقدي الآن",
      titleEn: "Cash now",
      descriptionAr: `${nounAr} فورًا مع خصم نقدي ${input.cashDiscountRate}%`,
      descriptionEn: `Immediate ${nounEn} with ${input.cashDiscountRate}% cash discount`,
      entries: [makeEntry(input, "cash", discountedNet, "بديل نقدي من محاكي القرارات")],
      cashEffect: immediateCash(gross(discountedNet), direction),
      commercialSaving: roundCurrency(input.amount - discountedNet),
      collectionExposure: 0,
      obligationExposure: 0,
    },
    {
      id: "credit" as const,
      titleAr: `آجل ${input.creditDays} يومًا`,
      titleEn: `${input.creditDays}-day credit`,
      descriptionAr: `${nounAr} كاملًا بعد ${input.creditDays} يومًا بدون خصم`,
      descriptionEn: `Full ${nounEn} after ${input.creditDays} days without discount`,
      entries: [makeEntry(input, "credit", input.amount, `بديل آجل ${input.creditDays} يومًا من محاكي القرارات`)],
      cashEffect: cashAtDue(gross(input.amount), input.creditDays, direction),
      commercialSaving: 0,
      collectionExposure: input.decisionType === "sale" ? gross(input.amount) : 0,
      obligationExposure: input.decisionType === "sale" ? 0 : gross(input.amount),
    },
    {
      id: "split" as const,
      titleAr: "50% الآن و50% آجل",
      titleEn: "50% now / 50% credit",
      descriptionAr: `نصف ${nounAr} الآن والنصف الآخر بعد ${input.creditDays} يومًا`,
      descriptionEn: `Half the ${nounEn} now and half after ${input.creditDays} days`,
      entries: [makeEntry(input, "cash", halfCashNet, "النصف النقدي من البديل المختلط"), makeEntry(input, "credit", halfCreditNet, `النصف الآجل لمدة ${input.creditDays} يومًا`) ],
      cashEffect: addHorizons(immediateCash(gross(halfCashNet), direction), cashAtDue(gross(halfCreditNet), input.creditDays, direction)),
      commercialSaving: roundCurrency(input.amount / 2 - halfCashNet),
      collectionExposure: input.decisionType === "sale" ? gross(halfCreditNet) : 0,
      obligationExposure: input.decisionType === "sale" ? 0 : gross(halfCreditNet),
    },
  ];

  const preliminary = definitions.map((definition) => {
    const projectedCash = addHorizons(input.baselineCash, definition.cashEffect);
    const minimumProjectedCash = Math.min(projectedCash.now, projectedCash.day7, projectedCash.day30, projectedCash.day90);
    const reserveGap = roundCurrency(Math.max(0, input.minimumReserve - minimumProjectedCash));
    const financialImpact = addImpact(definition.entries);
    const vat = roundCurrency(definition.entries.reduce((sum, entry) => sum + entry.amount * input.vatRate / 100, 0));
    const vatEffect = input.decisionType === "sale" ? vat : -vat;
    const exposure = definition.collectionExposure + definition.obligationExposure;
    const liquidityPenalty = Math.min(70, reserveGap / Math.max(input.amount, 1) * 100);
    const exposurePenalty = exposure / Math.max(gross(input.amount), 1) * (input.decisionType === "sale" ? 22 : 8);
    const savingBonus = definition.commercialSaving / Math.max(input.amount, 1) * 100;
    const bufferBonus = Math.min(12, Math.max(0, minimumProjectedCash - input.minimumReserve) / Math.max(input.amount, 1) * 10);
    const score = Math.max(0, Math.min(100, Math.round(78 - liquidityPenalty - exposurePenalty + savingBonus + bufferBonus)));
    const risk = reserveGap > 0 ? "high" as const : exposure > gross(input.amount) * .45 ? "medium" as const : "low" as const;
    const reasonsAr = [
      reserveGap > 0 ? `ينخفض الرصيد عن حد الأمان بمقدار ${reserveGap.toLocaleString("ar-EG")} ${input.currency}.` : "يحافظ على حد السيولة الآمن في الفترات المحللة.",
      definition.collectionExposure ? `يترك تحصيلًا معرضًا للتأخر بقيمة ${definition.collectionExposure.toLocaleString("ar-EG")} ${input.currency}.` : definition.obligationExposure ? `ينشئ التزام سداد مؤجلًا بقيمة ${definition.obligationExposure.toLocaleString("ar-EG")} ${input.currency}.` : "لا ينشئ رصيدًا آجلًا مفتوحًا.",
      definition.commercialSaving > 0 ? `يوفر خصمًا تجاريًا قدره ${definition.commercialSaving.toLocaleString("ar-EG")} ${input.currency}.` : "لا يحقق وفرًا من الخصم النقدي.",
    ];
    const reasonsEn = [
      reserveGap > 0 ? `Cash drops below the safety reserve by ${reserveGap.toLocaleString("en-US")} ${input.currency}.` : "Keeps cash above the safety reserve across the analyzed horizons.",
      definition.collectionExposure ? `Leaves ${definition.collectionExposure.toLocaleString("en-US")} ${input.currency} exposed to collection delay.` : definition.obligationExposure ? `Creates a deferred payment obligation of ${definition.obligationExposure.toLocaleString("en-US")} ${input.currency}.` : "Creates no open credit balance.",
      definition.commercialSaving > 0 ? `Captures a cash discount saving of ${definition.commercialSaving.toLocaleString("en-US")} ${input.currency}.` : "Captures no cash discount saving.",
    ];
    return { ...definition, projectedCash, financialImpact, vatEffect, minimumProjectedCash: roundCurrency(minimumProjectedCash), reserveGap, risk, score, reasonsAr, reasonsEn, recommended: false } satisfies DecisionAlternative;
  });

  const recommended = [...preliminary].sort((a, b) => b.score - a.score || b.minimumProjectedCash - a.minimumProjectedCash || a.id.localeCompare(b.id))[0];
  return { recommendedId: recommended.id, alternatives: preliminary.map((alternative) => ({ ...alternative, recommended: alternative.id === recommended.id })) };
}
