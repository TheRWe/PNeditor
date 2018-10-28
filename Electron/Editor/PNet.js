"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const purify_1 = require("../Helpers/purify");
class PNet {
    get AllArces() {
        return purify_1.flatten(this.transitions.map(x => x.Arces));
    }
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
    constructor() {
        this.places = [];
        this.transitions = [];
    }
}
exports.PNet = PNet;
class Transition {
    get Arces() {
        return this.arcs.map(x => ({ qty: x.qty, t: this, p: x.place }));
    }
    constructor(position = null) {
        this.arcs = [];
        this.position = position;
    }
}
exports.Transition = Transition;
class Place {
    constructor(id = null, name = null, position = null) {
        this.name = name;
        this.id = id;
        this.position = position;
    }
}
exports.Place = Place;
//# sourceMappingURL=PNet.js.map