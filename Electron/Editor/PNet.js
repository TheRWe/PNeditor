"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const purify_1 = require("../Helpers/purify");
class PNet {
    constructor() {
        //#region Edit Modifications
        this.placeID = 0;
        //#endregion
        //#region Running methods
        this.savedMarkings = [];
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
    SaveMarkings() {
        this.savedMarkings = this.places.map((p, i) => { return { place: p, marking: p.marking }; });
    }
    LoadMarkings() {
        this.ClearMarkings();
        this.savedMarkings.forEach(m => { m.place.marking = m.marking; });
    }
    ClearMarkings() {
        this.places.forEach(p => { p.marking = 0; });
    }
    IsTransitionEnabled(transition) {
        return transition != null && transition.arcs.every(v => (v.qty + v.place.marking) >= 0);
    }
    get EnabledTransitions() {
        return this.transitions.filter(t => this.IsTransitionEnabled(t));
    }
    RunTransition(transition) {
        if (!this.IsTransitionEnabled(transition))
            return false;
        transition.arcs.forEach(a => { a.place.marking += a.qty; });
        return true;
    }
    //#endregion
    toString() {
        // todo: https://github.com/dsherret/ts-nameof
        // todo: změna id
        // todo: možnost ukládat pouze name bez id pokud je name unikátní
        // todo: kontrola že se name neukládá pokud je "" | null | undefined
        const places = this.places.map(p => { return { name: p.name, id: p.id, position: p.position, marking: p.marking }; });
        const savedMarkings = this.savedMarkings.map(m => { return { place_id: m.place.id, marking: m.marking }; });
        const transitions = this.transitions.map(t => { return { position: t.position, arcs: t.arcs.map(a => { return { place_id: a.place.id, qty: a.qty }; }) }; });
        const json = { places: places, savedMarkings: savedMarkings, transitions: transitions };
        return JSON.stringify(json, null, 4);
    }
    static fromString(str) {
        const obj = JSON.parse(str);
        // todo: validace
        // todo: možnost používat name místo id
        const places = obj.places.map(p => new Place(p.id, p.name, p.position, p.marking));
        const transitions = obj.transitions.map(tj => {
            const t = new Transition(tj.position);
            t.arcs = tj.arcs.map(aj => { return { place: places.find(p => p.id === aj.place_id), qty: aj.qty }; });
            return t;
        });
        const savedMarkings = obj.savedMarkings.map(smj => {
            return { place: places.find(p => p.id === smj.place_id), marking: smj.marking };
        });
        const placeID = Math.max(-1, ...places.map(p => p.id)) + 1;
        return Object.assign(new PNet(), { places: places, transitions: transitions, savedMarkings: savedMarkings, placeID: placeID });
    }
}
exports.PNet = PNet;
class Transition {
    /** returns arc with transaction to work independent on this object */
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