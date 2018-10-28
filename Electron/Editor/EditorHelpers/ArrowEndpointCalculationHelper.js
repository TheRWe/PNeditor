"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const purify_1 = require("../../Helpers/purify");
// pomocná třída 
class AECH {
    GetArcEndpoints(arc) {
        const tPos = arc.t.position;
        // get all arces of transition
        const arcesT = arc.t.Arces;
        const arcesClassified = purify_1.classify(arcesT, 
        // main diag
        (a) => { return a.p.position.y < (a.p.position.x - a.t.position.x + a.t.position.y); }, 
        // scnd diag
        (a) => { return (a.p.position.y > (-a.p.position.x + a.t.position.x + a.t.position.y)); });
        const TEndpointsTOP = arcesClassified.filter(x => x.classifications[0] && !x.classifications[1]).map(x => x.element);
        const TEndpointsLEFT = arcesClassified.filter(x => !x.classifications[0] && !x.classifications[1]).map(x => x.element);
        const TEndpointsRIGHT = arcesClassified.filter(x => x.classifications[0] && x.classifications[1]).map(x => x.element);
        const TEndpointsBOT = arcesClassified.filter(x => !x.classifications[0] && x.classifications[1]).map(x => x.element);
        console.log(arcesClassified);
        const leftPoint = { x: tPos.x - 10, y: tPos.y };
        const rightPoint = { x: tPos.x + 10, y: tPos.y };
        const topPoint = { x: tPos.x, y: tPos.y - 10 };
        const botPoint = { x: tPos.x, y: tPos.y + 10 };
        // todo: json comparison
        const toPos = TEndpointsTOP.findIndex((a) => { return a.p === arc.p && a.t === arc.t && a.qty === arc.qty; }) >= 0 ? topPoint :
            TEndpointsLEFT.findIndex((a) => { return a.p === arc.p && a.t === arc.t && a.qty === arc.qty; }) >= 0 ? leftPoint :
                TEndpointsRIGHT.findIndex((a) => { return a.p === arc.p && a.t === arc.t && a.qty === arc.qty; }) >= 0 ? rightPoint :
                    TEndpointsBOT.findIndex((a) => { return a.p === arc.p && a.t === arc.t && a.qty === arc.qty; }) >= 0 ? botPoint :
                        { x: 0, y: 0 };
        return {
            from: arc.p.position,
            to: toPos
        };
        //todo: implement
        //throw { name: "NotImplementedError", message: "too lazy to implement" }; 
    }
    constructor(net) {
        this.net = net;
    }
}
exports.AECH = AECH;
//# sourceMappingURL=ArrowEndpointCalculationHelper.js.map