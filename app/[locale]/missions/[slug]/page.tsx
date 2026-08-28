import { notFound } from "next/navigation";
import { MissionPlayer } from "@/components/missions/mission-player";
import { getMissionBySlug, missions } from "@/data/missions";
import type { Locale } from "@/types";

export function generateStaticParams(){return missions.flatMap((mission)=>[{locale:"ar",slug:mission.slug},{locale:"en",slug:mission.slug}]);}
export default async function Page({params}:{params:Promise<{locale:Locale;slug:string}>}){const{locale,slug}=await params,mission=getMissionBySlug(slug);if(!mission)notFound();return <MissionPlayer mission={mission} locale={locale}/>;}

