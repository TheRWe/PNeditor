import { ModelBase } from "../_Basic/ModelBase";
import { Position, numbers, ForceNode } from "../../../definitions/Constants";

export class PNModel extends ModelBase<JSONNet>{
    public selected: { places: Place[], tranisitons: Transition[] } = null;

    public places: Place[];
    public transitions: Transition[];
    public arcs: Arc[];

    public toJSON(): JSONNet {
        const places: { name?: string, id: number, position?: Position, marking?: number }[]
            = this.places.map(p => { return { id: p.id, position: ((p.x !== undefined && p.y !== undefined) ? { x: p.x, y: p.y } : undefined), marking: p.marking }; });

        const transitions: { position?: Position, id: number, isCold?: boolean }[]
            = this.transitions.map(t => { return { position: (t.x !== undefined && t.y !== undefined) ? { x: t.x, y: t.y } : undefined, id: t.id, isCold: t.isCold } });

        const arcs: { transition_id: number, place_id: number, toPlace: number, toTransition: number, }[]
            = this.arcs.map(a => { return { place_id: a.place.id, transition_id: a.transition.id, toPlace: a.toPlace, toTransition: a.toTransition }; });

        const json: JSONNet = { places: places, transitions: transitions, arcs: arcs };

        return json;
    }

    public fromJSON(json: JSONNet): boolean {
        if ((json.places.map(p => p.id).slice().sort().reduce((x, y) => x < 0 ? -1 : (x === y ? -1 : y), Number.MAX_SAFE_INTEGER) === -1)
            || (json.transitions.map(p => p.id).slice().sort().reduce((x, y) => x < 0 ? -1 : (x === y ? -1 : y), Number.MAX_SAFE_INTEGER) === -1)
            || (json.arcs.map(a => a.place_id).map(pid => json.places.map(p => p.id).findIndex(p => p === pid)).some(x => x === -1))
            || (json.arcs.map(a => a.transition_id).map(tid => json.transitions.map(t => t.id).findIndex(t => t === tid)).some(x => x === -1))
            || (json.arcs.map(a => a.toPlace || 0).some(x => x < 0))
            || (json.arcs.map(a => a.toTransition || 0).some(x => x < 0))
            )
            return false;

        const places: Place[] = json.places.map(p => new Place(p.position, p.marking || 0, p.id))

        const transitions: Transition[] = json.transitions.map(tj => {
            const t = new Transition(tj.position, tj.id);
            t.isCold = tj.isCold || false;
            return t;
        })

        const arcs = json.arcs.map(aj => {
            const t = transitions.find(t => t.id === aj.transition_id)
            const p = places.find(p => p.id === aj.place_id);
            return new Arc(t, p, aj.toPlace || 0, aj.toTransition || 0);
        });

        Object.assign(this, { places: places, transitions: transitions, arcs: arcs });

        return true;
    }

    public getArcesOfTransition(transition: Transition): Arc[] {
        return this.arcs.filter(a => a.transition === transition);
    }

    public IsTransitionEnabled(transition: Transition | null): boolean {
        return transition != null &&
            this.getArcesOfTransition(transition).every(v => ((v.place.marking || 0) - (v.toTransition || 0)) >= 0);
    }

    public get EnabledTransitions(): Transition[] {
        return this.transitions.filter(t => this.IsTransitionEnabled(t));
    }

    constructor() {
        super();
        this.places = [];
        this.transitions = [];
        this.arcs = [];
    }
}

export class Transition implements ForceNode {
    public isCold: boolean = false;

    public readonly id: number;
    private static idMaker = 0;

    constructor(position: Position | null = null, id: number = -1) {
        if (position) {
            this.x = position.x;
            this.y = position.y;
        } else {
            this.x = 0;
            this.y = 0;
        }

        if (id >= 0) {
            this.id = id;
            if (id >= Transition.idMaker)
                Transition.idMaker = id + 1;
        }
        else
            this.id = Transition.idMaker++;
    }

    //#region ForceNode

    public index: number;
    public vx: number;
    public vy: number;
    public x: number;
    public y: number;
    public fx: number;
    public fy: number;

    //#endregion
}

export class Place implements ForceNode {
    public marking: number | null;

    public id: number | null;
    private static idMaker = 0;

    constructor(position: Position | null = null, marking: number | null = null, id: number = -1) {
        if (position) {
            this.x = position.x;
            this.y = position.y;
        } else {
            this.x = 0;
            this.y = 0;
        }
        this.marking = marking || 0;

        if (id >= 0) {
            this.id = id;
            if (id >= Place.idMaker)
                Place.idMaker = id + 1;
        }
        else
            this.id = Place.idMaker++;
    }

    //#region ForceNode

    public index: number;
    public vx: number;
    public vy: number;
    public x: number = 0;
    public y: number = 0;
    public fx: number;
    public fy: number;

    //#endregion
}

export class Arc {
    transition: Transition;
    place: Place;
    toPlace: number;
    toTransition: number;

    constructor(transition: Transition, place: Place, toPlace: number, toTransition: number) {
        this.transition = transition;
        this.place = place;
        this.toPlace = toPlace;
        this.toTransition = toTransition;
    }
}

export type JSONNet = {
    places:
    {
        id: number,
        position?: Position,
        marking?: number,
    }[],
    transitions: {
        id: number,
        position?: Position,
        isCold?: boolean,
    }[],
    arcs: {
        transition_id: number,
        place_id: number,
        toPlace: number,
        toTransition: number,
    }[],
}


export type placeMarking = { id: number, marking: number };
export type marking = placeMarking[];
export type netConfiguration = { marking: placeMarking[], enabledTransitionsIDs: number[], usedTransition?: number }

export function CalculateNextConfiguration(net: JSONNet, currentMarking: marking, transitionID: number): netConfiguration {
    if (!GetEnabledTransitionsIDs(net, currentMarking).some(x => x === transitionID))
        throw new Error("cannot enable transition");

    const marking: placeMarking[] = net.places.map(p => {
        let marking = (currentMarking.find(x => p.id === x.id) || { marking: 0 }).marking;
        const arces = net.arcs.filter(x => x.place_id === p.id && x.transition_id === transitionID);
        if (marking !== numbers.omega)
            arces.forEach(x => { marking += x.toPlace - x.toTransition });
        return { id: p.id, marking } as placeMarking;
    });
    const enabledTransitionsIDs: number[] = GetEnabledTransitionsIDs(net, marking);

    return { marking, enabledTransitionsIDs };
}

export function GetEnabledTransitionsIDs(net: JSONNet, currentMarking: marking) {
    return net.transitions.filter(t => {
        return net.arcs
            .filter(x => x.transition_id === t.id)
            .filter(x => x.toTransition > 0)
            .every(x => x.toTransition <= (currentMarking.find(y => y.id === x.place_id) || { marking: 0 }).marking);
    }).map(t => t.id);
}
