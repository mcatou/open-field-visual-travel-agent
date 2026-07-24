export type DemoPath = "vintage" | "luxury" | "fused";

export type DemoWorkflow =
  | { kind: "load_route"; route: "fashion" | "vintage" }
  | { kind: "select_path"; path: DemoPath; notice: string };

export function resolveDemoWorkflow(
  question: string,
  currentRegionId: string,
): DemoWorkflow | null {
  if (/vintage|thrift|secondhand|second-hand|archive shopping|古着/i.test(question)) {
    return { kind: "load_route", route: "vintage" };
  }

  if (/current fashion|ready-to-wear|us(?:\s+size)?\s*6\s*[-–]\s*8/i.test(question)) {
    return { kind: "load_route", route: "fashion" };
  }

  if (/three stores|30 minutes late|(?:walk|walking)[^.]{0,80}(?:10|12) minutes|(?:10|12) minutes[^.]{0,80}(?:walk|walking)/i.test(question)) {
    return {
      kind: "select_path",
      path: "fused",
      notice: currentRegionId === "tokyo-vintage"
        ? "Showing the compact Harajuku route."
        : "Showing the shorter three-store route.",
    };
  }

  if (/cheaper stops|lower recent online price/i.test(question)) {
    return {
      kind: "select_path",
      path: "fused",
      notice: "Showing the compact vintage cluster.",
    };
  }

  if (/japanese designers|archive pieces/i.test(question)) {
    return {
      kind: "select_path",
      path: currentRegionId === "tokyo-vintage" ? "luxury" : "vintage",
      notice: "Showing the route with the strongest Japanese-designer focus.",
    };
  }

  return null;
}
