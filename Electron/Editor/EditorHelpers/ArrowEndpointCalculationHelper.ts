import { Transition, Place, PNet, Position, Arc } from "../PNet";
import { classify, SortKeySelector } from "../../Helpers/purify";
import { transition } from "d3";

// pomocná třída 
export class AECH
{
    private readonly net: PNet;

    //todo: casching
    public GetArcEndpoints(arc: Arc): { from: Position, to: Position, endsIn: "T" | "P" }
    {
        //todo: implement
        const tPos = arc.t.position;

        // get all arces of transition
        const arcesT = arc.t.Arces;
        const arcesClassified = classify(arcesT,
            // main diag
            (a) => { return a.p.position.y < (a.p.position.x - a.t.position.x + a.t.position.y); },
            // scnd diag
            (a) => { return a.p.position.y > (-a.p.position.x + a.t.position.x + a.t.position.y); })

        type side = "TOP" | "BOT" | "LEFT" | "RIGHT";
        const sides: side[] = ["TOP", "BOT", "LEFT", "RIGHT"];

        const arcesWithSides = arcesClassified.map(x => {
            const side: side = (x.classifications[0] && !x.classifications[1]) ? "TOP" :
                            (!x.classifications[0] && !x.classifications[1]) ? "LEFT" :
                            (x.classifications[0] && x.classifications[1]) ? "RIGHT" : "BOT";
            return { arc: x.element, side: side };
        });

        const defaultTransitionPositionSides = {
            "TOP": { x: tPos.x-10, y: tPos.y - 10 },
            "BOT": { x: tPos.x-10, y: tPos.y + 10 },
            "LEFT": { x: tPos.x - 10, y: tPos.y+10 },
            "RIGHT": { x: tPos.x + 10, y: tPos.y+10 },
        }

        const arcWithTransitionPosition: { arc: Arc, pos: Position }[] = [];

        sides.forEach(s =>
        {
            const sideDependentValue = (s === "BOT" || s === "TOP") ? "x" : "y";
            const selectorHelper =
                SortKeySelector((x: any) => { return x.arc[sideDependentValue] as number; });

            const arcsInThisSide = arcesWithSides.filter(x => x.side === s).sort(selectorHelper);
            const len = arcsInThisSide.length;
            if (len === 0) return;
            // odskok
            const jump = ((s === "BOT" || s === "TOP")?1:-1)*20 / (len + 1);
            
            let pos: Position = defaultTransitionPositionSides[s] as Position;

            arcsInThisSide.forEach(a =>
            {
                pos[sideDependentValue] += jump;
                const pospos = { x: pos.x, y: pos.y };
                arcWithTransitionPosition.push({ arc: a.arc, pos: pospos });
            });
        });

        var transitionPos = arcWithTransitionPosition.find((ap) =>
        {
            const a = ap.arc;
            return arc.qty === a.qty && arc.p === a.p && arc.t === a.t;
        }).pos;

        if (arc.qty >= 0)
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

    constructor(net: PNet)
    {
        this.net = net;
    }
}