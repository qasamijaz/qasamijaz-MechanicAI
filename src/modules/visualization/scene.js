/** Pure, replaceable conceptual scene generator. No external AI API. */
export function createScene(plan, options = {}) {
  if (!plan || !plan.domain) return null;
  const width = Math.max(2, Math.min(30, Number(options.width) || 8));
  const length = Math.max(2, Math.min(40, Number(options.length) || 12));
  if (plan.domain === "construction") {
    return { kind: "fence", width, length, units: "m", status: "conceptual",
      posts: Array.from({ length: Math.ceil(length / 2) + 1 }, (_, i) => ({ x: Math.min(length, i * 2) })),
      warning: "Illustrativt hegn. Fundament, højde, skel og lokale regler er ikke verificeret." };
  }
  if (plan.domain === "architecture") {
    return { kind: "floorplan", width, length, units: "m", status: "conceptual",
      rooms: [{ x: 0, y: 0, w: .55, h: .55, name: "Stue" },
        { x: .55, y: 0, w: .45, h: .55, name: "Køkken" },
        { x: 0, y: .55, w: .5, h: .45, name: "Værelse" },
        { x: .5, y: .55, w: .5, h: .45, name: "Bad / entré" }],
      warning: "Konceptskitse uden døre, installationer, konstruktion eller myndighedsgodkendelse." };
  }
  if (plan.domain === "electrical") {
    return { kind: "lights", width, length, units: "m", status: "conceptual",
      points: [{ x: .25, y: .5 }, { x: .5, y: .5 }, { x: .75, y: .5 }],
      warning: "Kun lampeplacering, ikke elektrisk installation eller ledningsføring." };
  }
  return { kind: "guide", status: "conceptual", steps: plan.preview || [],
    warning: "Illustrativ procesoversigt; ingen verificerede reparationsinstruktioner." };
}
