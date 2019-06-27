import { Position } from "../../../../CORE/Constants";
import { classify, SortKeySelector } from "../../../../Helpers/purify";
import { PNModel, Arc } from "../PNModel";

//todo: casching
/**
 * Helper function for calculating endpoints of arces
 * @param net whole net
 * @param arc arc currently calculated arc
 */
export function GetArcEndpoints(net: PNModel, arc: Arc): { from: Position, to: Position } {
    const tPos = { x: arc.transition.x, y: arc.transition.y  };

    // get all arces of transition
    const arcesT = net.getArcesOfTransition(arc.transition);
    const arcesClassified = classify(arcesT,
        // main diag
        (a) => { return a.place.y < (a.place.x - a.transition.x + a.transition.y); },
        // scnd diag
        (a) => { return a.place.y > (-a.place.x + a.transition.x + a.transition.y); })

    type side = "TOP" | "BOT" | "LEFT" | "RIGHT";
    const sides: side[] = ["TOP", "BOT", "LEFT", "RIGHT"];

    const arcesWithSides = arcesClassified.map(x => {
        const side: side = (x.classifications[0] && !x.classifications[1]) ? "TOP" :
            (!x.classifications[0] && !x.classifications[1]) ? "LEFT" :
                (x.classifications[0] && x.classifications[1]) ? "RIGHT" : "BOT";
        return { arc: x.element, side: side };
    });

    const defaultTransitionPositionSides = {
        "TOP": { x: tPos.x - 10, y: tPos.y - 10 },
        "BOT": { x: tPos.x - 10, y: tPos.y + 10 },
        "LEFT": { x: tPos.x - 10, y: tPos.y - 10 },
        "RIGHT": { x: tPos.x + 10, y: tPos.y - 10 },
    }

    const arcWithTransitionPosition: { arc: Arc, pos: Position }[] = [];

    sides.forEach(s => {
        const sideDependentValue = (s === "BOT" || s === "TOP") ? "x" : "y";
        const selectorHelper =
            SortKeySelector((x: any) => { return x.arc.place[sideDependentValue] as number; });

        const arcsInThisSide = arcesWithSides.filter(x => x.side === s).sort(selectorHelper);
        const len = arcsInThisSide.length;
        if (len === 0) return;
        // odskok
        const jump = 20 / (len + 1);

        let pos: Position = defaultTransitionPositionSides[s] as Position;

        arcsInThisSide.forEach(a => {
            pos[sideDependentValue] += jump;
            const pospos = { x: pos.x, y: pos.y };
            arcWithTransitionPosition.push({ arc: a.arc, pos: pospos });
        });
    });

    var transitionPos = arcWithTransitionPosition.find((ap) => {
        const a = ap.arc;
        return arc == a;
    }).pos;

    return {
        from: transitionPos,
        to: { x: arc.place.x, y: arc.place.y },
    };
} 