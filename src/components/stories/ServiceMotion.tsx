"use client";

import type { ComponentType } from "react";
import type { MotionKind } from "@/data/services";
import { CurtainSequence } from "../home/CurtainSequence";
import { MotionShowcase, type Build } from "./StoryScene";
import {
  CarpetVisual,
  carpetBuild,
  CommercialVisual,
  commercialBuild,
  FloorVisual,
  floorBuild,
  HouseVisual,
  houseBuild,
  PaintingVisual,
  paintingBuild,
  ResidentialVisual,
  residentialBuild,
  RestorationVisual,
  restorationBuild,
  TileVisual,
  tileBuild,
  UpholsteryVisual,
  upholsteryBuild,
  WindowVisual,
  windowBuild,
} from "./visuals";

type Scene = { Visual: ComponentType; build: Build; title: string; steps: string[] };

export const SCENES: Record<Exclude<MotionKind, "curtain">, Scene> = {
  residential: {
    Visual: ResidentialVisual,
    build: residentialBuild,
    title: "Detail you can see – and feel.",
    steps: ["Surfaces pre-sprayed with the right product", "Splashbacks wiped streak-free", "Benches cleaned edge to edge", "Fittings polished to finish"],
  },
  carpet: {
    Visual: CarpetVisual,
    build: carpetBuild,
    title: "Down to the fibre.",
    steps: ["Pre-vacuum and traffic-lane pre-treatment", "Hot-water extraction, lane by lane", "Spot treatment of marks", "Pile groomed for even drying"],
  },
  upholstery: {
    Visual: UpholsteryVisual,
    build: upholsteryBuild,
    title: "A fresh start for fabric.",
    steps: ["Fabric code checked", "Soiled areas pre-treated", "Extraction or low-moisture clean", "Pile groomed and left to dry"],
  },
  window: {
    Visual: WindowVisual,
    build: windowBuild,
    title: "More light, fewer streaks.",
    steps: ["Glass washed with purified water", "Squeegeed in overlapping passes", "Frames and sills wiped", "Final check in natural light"],
  },
  floor: {
    Visual: FloorVisual,
    build: floorBuild,
    title: "The right level of floor care.",
    steps: ["Floor assessed – clean, strip, sand or seal", "Machine passes across the whole area", "Edges and corners detailed", "Finish coat or polish applied"],
  },
  tile: {
    Visual: TileVisual,
    build: tileBuild,
    title: "Grout lines, brought back.",
    steps: ["Pre-treatment worked into grout", "Rotary clean, lane by lane", "Rinse and extraction", "Optional sealer for lasting protection"],
  },
  house: {
    Visual: HouseVisual,
    build: houseBuild,
    title: "Soft-washed, top to bottom.",
    steps: ["Surfaces and plants protected", "Low-pressure treatment applied", "Washed down from the top", "Joinery and windows rinsed"],
  },
  restoration: {
    Visual: RestorationVisual,
    build: restorationBuild,
    title: "Measured, documented recovery.",
    steps: ["Damage assessed and recorded", "Extraction and drying set up", "Moisture monitored daily", "Sign-off with documentation"],
  },
  commercial: {
    Visual: CommercialVisual,
    build: commercialBuild,
    title: "Done after hours. Ready by morning.",
    steps: ["Team arrives after close", "Desks and touchpoints cleaned zone by zone", "Floors machine-cleaned", "Checked and locked up"],
  },
  painting: {
    Visual: PaintingVisual,
    build: paintingBuild,
    title: "Prepared properly. Finished beautifully.",
    steps: ["Surfaces prepared and protected", "Edges cut in and taped", "Rolled in even, overlapping passes", "Tape lifted, room put back"],
  },
};

/** The animated scene for a service detail page. */
export function ServiceMotion({ kind, serviceSlug }: { kind: MotionKind; serviceSlug: string }) {
  if (kind === "curtain") {
    return <CurtainSequence ctaHref={`/quote?service=${serviceSlug}`} ctaLabel="Get a Curtain Care quote" />;
  }
  const s = SCENES[kind];
  return <MotionShowcase title={s.title} steps={s.steps} visual={<s.Visual />} build={s.build} />;
}
