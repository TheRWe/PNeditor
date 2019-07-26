import { ModelBase } from "../_Basic/ModelBase";
import { Position, numbers } from "./../../../CORE/Constants";
import { ForceNode } from "../_Basic/DrawBase";

export class PNModel extends ModelBase<JSONNet>{
    public selected: { places: Place[], tranisitons: Transition[] } = null;

    public places: Place[];
    public transitions: Transition[];
    public arcs: Arc[];

    public toJSON(): JSONNet {
        // todo: https://github.com/dsherret/ts-nameof
        // todo: změna id
        // todo: možnost ukládat pouze name bez id pokud je name unikátní
        // todo: kontrola že se name neukládá pokud je "" | null | undefined
        const places: { name?: string, id: number, position?: Position, marking?: number }[]
            = this.places.map(p => { return { name: p.name, id: p.id, position: ((p.x !== undefined && p.y !== undefined) ? { x: p.x, y: p.y } : undefined), marking: p.marking }; });

        const transitions: { position?: Position, id: number, isCold?: boolean }[]
            = this.transitions.map(t => { return { position: (t.x !== undefined && t.y !== undefined) ? { x: t.x, y: t.y } : undefined, id: t.id, isCold: t.isCold } });

        const arcs: { transition_id: number, place_id: number, toPlace: number, toTransition: number, }[]
            = this.arcs.map(a => { return { place_id: a.place.id, transition_id: a.transition.id, toPlace: a.toPlace, toTransition: a.toTransition }; });

        const json: JSONNet = { places: places, transitions: transitions, arcs: arcs };

        return json;
    }

    public fromJSON(json: JSONNet): boolean {
        // todo: možnost používat name místo id
        const places: Place[] = json.places.map(p => new Place(p.name, p.position, p.marking, p.id))

        const transitions: Transition[] = json.transitions.map(tj => {
            const t = new Transition(tj.position, tj.id);
            t.isCold = tj.isCold;
            return t;
        })

        const arcs = json.arcs.map(aj =>
            new Arc(transitions.find(t => t.id === aj.transition_id), places.find(p => p.id === aj.place_id), aj.toPlace, aj.toTransition));

        const placeID: number = Math.max(-1, ...places.map(p => p.id)) + 1;

        Object.assign(this, { places: places, transitions: transitions, placeID: placeID, arcs: arcs });

        // todo: validace
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
    // todo: implementovat cold transitions
    public isCold: boolean = false;

    //todo: o id a odkazování se bude starat ukládání a načítání
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
    public name: string | null;
    public marking: number | null;

    //todo: o id a odkazování se bude starat ukládání a načítání
    public id: number | null;
    private static idMaker = 0;

    constructor(name: string | null = null, position: Position | null = null, marking: number | null = null, id: number = -1) {
        if (position) {
            this.x = position.x;
            this.y = position.y;
        } else {
            this.x = 0;
            this.y = 0;
        }
        this.name = name;
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
        name?: string,
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
