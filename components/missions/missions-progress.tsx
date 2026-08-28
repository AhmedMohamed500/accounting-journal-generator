"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Target, Trophy } from "lucide-react";
import { missions } from "@/data/missions";
import { loadMissionsProgress, subscribeToMissionsProgress } from "@/lib/storage/missions";
import type { Locale, MissionsProgress } from "@/types";

export function MissionsProgressView({locale}:{locale:Locale}) { const ar=locale==="ar",[progress,setProgress]=useState<MissionsProgress>({schemaVersion:1,records:{}});useEffect(()=>{setProgress(loadMissionsProgress());return subscribeToMissionsProgress(setProgress)},[]);const records=Object.values(progress.records),completed=records.filter((record)=>record.completed).length,total=records.reduce((sum,record)=>sum+record.bestScore,0);return <div className="mission-play-page"><div className="missions-container missions-progress-page"><span className="missions-kicker"><Trophy/>{ar?"تقدمي":"My progress"}</span><h1>{ar?"كل محاولة بتخليك محاسب أقوى.":"Every attempt makes you a stronger accountant."}</h1><div className="mission-result-grid"><Result label={ar?"المهمات المكتملة":"Completed"} value={`${completed}/${missions.length}`}/><Result label={ar?"إجمالي أفضل النقاط":"Total best score"} value={String(total)}/><Result label={ar?"إجمالي المحاولات":"Total attempts"} value={String(records.reduce((sum,record)=>sum+record.attempts,0))}/></div><div className="mission-progress-list">{missions.map((mission)=>{const record=progress.records[mission.id];return <article key={mission.id}><span>{record?.completed?<CheckCircle2/>:<Target/>}</span><div><small>CASE #{mission.caseNumber}</small><b>{ar?mission.titleAr:mission.titleEn}</b><p>{record?`${ar?"أفضل نتيجة":"Best score"}: ${record.bestScore} · ${ar?"محاولات":"Attempts"}: ${record.attempts}`:(ar?"لم تبدأ بعد":"Not started")}</p></div><Link href={`/${locale}/missions/${mission.slug}`}>{ar?<ArrowLeft/>:<ArrowRight/>}</Link></article>})}</div></div></div>;}
function Result({label,value}:{label:string;value:string}){return <div><span>{label}</span><b>{value}</b></div>}

