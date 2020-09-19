import { Position } from "../../../../definitions/Constants";
import { classify, SortKeySelector } from "../../../../CORE/Helpers/purify";
import { PNModel, Arc } from "../PNModel";

/**
 * Helper function for calculating endpoints of arces
 * @param net whole net
 * @param arc arc currently calculated arc
 */
export const GetArcEndpoints = (net: PNModel, arc: Arc): { from: Position, to: Position } => {
  const tPos = { x: arc.transition.x, y: arc.transition.y };

  // get all arces of transition
  const arcesT = net.getArcesOfTransition(arc.transition);
  const arcesClassified = classify(arcesT,
    // main diag
    (a) => { return a.place.y < (a.place.x - a.transition.x + a.transition.y); },
    // scnd diag
    (a) => { return a.place.y > (-a.place.x + a.transition.x + a.transition.y); });

  type side = "TOP" | "BOT" | "LEFT" | "RIGHT";
  const sides: side[] = ["TOP", "BOT", "LEFT", "RIGHT"];

  const arcesWithSides = arcesClassified.map(x => {
    const side: side = (x.classifications[0] && !x.classifications[1]) ? "TOP" :
      (!x.classifications[0] && !x.classifications[1]) ? "LEFT" :
        (x.classifications[0] && x.classifications[1]) ? "RIGHT" : "BOT";
    return { arc: x.element, side };
  });

  const size = 10;
  const defaultTransitionPositionSides = {
    "TOP": { x: tPos.x - size, y: tPos.y - size },
    "BOT": { x: tPos.x - size, y: tPos.y + size },
    "LEFT": { x: tPos.x - size, y: tPos.y - size },
    "RIGHT": { x: tPos.x + size, y: tPos.y - size },
  };

  const arcWithTransitionPosition: { arc: Arc, pos: Position }[] = [];

  sides.forEach(s => {
    const sideDependentValue = (s === "BOT" || s === "TOP") ? "x" : "y";
    const selectorHelper =
      SortKeySelector((x: any) => { return x.arc.place[sideDependentValue] as number; });

    const arcsInThisSide = arcesWithSides.filter(x => x.side === s).sort(selectorHelper);
    const len = arcsInThisSide.length;
    if (len === 0) return;

    const jump = 20 / (len + 1);

    const pos: Position = defaultTransitionPositionSides[s] as Position;

    arcsInThisSide.forEach(a => {
      pos[sideDependentValue] += jump;
      const pospos = { x: pos.x, y: pos.y };
      arcWithTransitionPosition.push({ arc: a.arc, pos: pospos });
    });
  });

  const transitionPos = arcWithTransitionPosition.find((ap) => {
    const a = ap.arc;
    return arc === a;
  }).pos;

  return {
    from: transitionPos,
    to: { x: arc.place.x, y: arc.place.y },
  };
};
