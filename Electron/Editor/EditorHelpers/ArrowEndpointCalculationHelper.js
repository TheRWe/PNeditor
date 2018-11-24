"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const purify_1 = require("../../Helpers/purify");
// pomocná třída 
class AECH {
    //todo: casching
    GetArcEndpoints(arc) {
        const tPos = arc.t.position;
        // get all arces of transition
        const arcesT = arc.t.ArcesIndependent;
        const arcesClassified = purify_1.classify(arcesT, 
        // main diag
        (a) => { return a.p.position.y < (a.p.position.x - a.t.position.x + a.t.position.y); }, 
        // scnd diag
        (a) => { return a.p.position.y > (-a.p.position.x + a.t.position.x + a.t.position.y); });
        const sides = ["TOP", "BOT", "LEFT", "RIGHT"];
        const arcesWithSides = arcesClassified.map(x => {
            const side = (x.classifications[0] && !x.classifications[1]) ? "TOP" :
                (!x.classifications[0] && !x.classifications[1]) ? "LEFT" :
                    (x.classifications[0] && x.classifications[1]) ? "RIGHT" : "BOT";
            return { arc: x.element, side: side };
        });
        const defaultTransitionPositionSides = {
            "TOP": { x: tPos.x - 10, y: tPos.y - 10 },
            "BOT": { x: tPos.x - 10, y: tPos.y + 10 },
            "LEFT": { x: tPos.x - 10, y: tPos.y - 10 },
            "RIGHT": { x: tPos.x + 10, y: tPos.y - 10 },
        };
        const arcWithTransitionPosition = [];
        sides.forEach(s => {
            const sideDependentValue = (s === "BOT" || s === "TOP") ? "x" : "y";
            const selectorHelper = purify_1.SortKeySelector((x) => { return x.arc.p.position[sideDependentValue]; });
            const arcsInThisSide = arcesWithSides.filter(x => x.side === s).sort(selectorHelper);
            const len = arcsInThisSide.length;
            if (len === 0)
                return;
            // odskok
            const jump = 20 / (len + 1);
            let pos = defaultTransitionPositionSides[s];
            arcsInThisSide.forEach(a => {
                pos[sideDependentValue] += jump;
                const pospos = { x: pos.x, y: pos.y };
                arcWithTransitionPosition.push({ arc: a.arc, pos: pospos });
            });
        });
        var transitionPos = arcWithTransitionPosition.find((ap) => {
            const a = ap.arc;
            return arc.qty.value === a.qty.value && arc.p === a.p && arc.t === a.t;
        }).pos;
        if (arc.qty.value >= 0)
            return {
                from: transitionPos,
                to: arc.p.position,
                endsIn: "P"
            };
        else
            return {
                from: arc.p.position,
                to: transitionPos,
                endsIn: "T"
            };
        //throw { name: "NotImplementedError", message: "too lazy to implement" }; 
    }
    constructor(net) {
        this.net = net;
    }
}
exports.AECH = AECH;
//# sourceMappingURL=ArrowEndpointCalculationHelper.js.map