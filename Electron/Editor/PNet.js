"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const purify_1 = require("../Helpers/purify");
class PNet {
    constructor() {
        //#region Modifications
        this.placeID = 0;
        this.places = [];
        this.transitions = [];
    }
    get AllArces() {
        return purify_1.flatten(this.transitions.map(x => x.ArcesIndependent));
    }
    AddPlace(pos, name = null) {
        const place = new Place(this.placeID++, name, pos);
        this.places.push(place);
        return place;
    }
    AddArc(t, p, qty) {
        t.arcs.push({ place: p, qty: qty });
    }
    //#endregion
    toString() {
        //todo: https://github.com/dsherret/ts-nameof
        let ignore = [];
        return JSON.stringify(this, (key, value) => { return ignore.indexOf(key) !== -1 ? undefined : value; });
    }
    static fromString(str) {
        const obj = JSON.parse(str);
        const net = new PNet();
        return Object.assign(net, obj);
    }
}
exports.PNet = PNet;
class Transition {
    /** returns arc with transaction to work independent od this object */
    get ArcesIndependent() {
        return this.arcs.map(x => ({ qty: new purify_1.Ref(() => x.qty, (v) => x.qty = v), t: this, p: x.place }));
    }
    constructor(position = null) {
        this.arcs = [];
        this.position = position;
    }
}
exports.Transition = Transition;
class Place {
    constructor(id = null, name = null, position = null, marking = null) {
        this.name = name;
        this.id = id;
        this.position = position;
        this.marking = marking;
    }
}
exports.Place = Place;
//# sourceMappingURL=PNet.js.map