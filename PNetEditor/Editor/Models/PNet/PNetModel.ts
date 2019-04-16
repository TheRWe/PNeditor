import { ModelBase, ModelJSONType } from "../_Basic/ModelBase";
import { Position } from "./../../Constants";

export class PNetModel extends ModelBase<JSONNet>{
    public places: Place[];
    public transitions: Transition[];
    public arcs: Arc[];

    public toJSON(): JSONNet {
        // todo: https://github.com/dsherret/ts-nameof
        // todo: změna id
        // todo: možnost ukládat pouze name bez id pokud je name unikátní
        // todo: kontrola že se name neukládá pokud je "" | null | undefined
        const places: { name?: string, id: number, position?: Position, marking?: number }[]
            = this.places.map(p => { return { name: p.name, id: p.id, position: { ...p.position }, marking: p.marking }; });

        const transitions: { position?: Position, id: number }[]
            = this.transitions.map(t => { return { position: { ...t.position }, id: t.id } });

        const arcs: { place_id: number, transition_id: number, qty: number }[]
            = this.arcs.map(a => { return { place_id: a.place.id, transition_id: a.transition.id, qty: a.qty }; });

        const json: JSONNet = { places: places, transitions: transitions, arcs: arcs };

        return json;
    }

    public fromJSON(json: JSONNet): boolean {
        // todo: možnost používat name místo id
        const places: Place[] = json.places.map(p => new Place(p.name, p.position, p.marking, p.id))

        const transitions: Transition[] = json.transitions.map(tj => {
            const t = new Transition(tj.position, tj.id);
            return t;
        })

        const arcs = json.arcs.map(aj => new Arc(transitions.find(t => t.id === aj.transition_id), places.find(p => p.id === aj.place_id), aj.qty));

        const placeID: number = Math.max(-1, ...places.map(p => p.id)) + 1;

        Object.assign(this, { places: places, transitions: transitions, placeID: placeID, arcs: arcs });

        // todo: validace
        return true;
    }

    public getArcesOfTransition(transition: Transition): Arc[] {
        return this.arcs.filter(a => a.transition === transition);
    }

    public IsTransitionEnabled(transition: Transition | null): boolean {
        return transition != null && this.getArcesOfTransition(transition).every(v => (v.qty + v.place.marking) >= 0);
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

export class Transition {
    public position: Position | null;
    // todo: implementovat cold transitions
    public isCold: boolean = false;

    //todo: o id a odkazování se bude starat ukládání a načítání
    public readonly id: number;
    private static idMaker = 0;

    constructor(position: Position | null = null, id: number = -1) {
        this.position = position;

        if (id >= 0) {
            this.id = id;
            if (id >= Transition.idMaker)
                Transition.idMaker = id + 1;
        }
        else
            this.id = Transition.idMaker++;
    }
}

export class Place {
    public name: string | null;
    public position: Position | null;
    public marking: number | null;

    //todo: o id a odkazování se bude starat ukládání a načítání
    public id: number | null;
    private static idMaker = 0;

    constructor(name: string | null = null, position: Position | null = null, marking: number | null = null, id: number = -1) {
        this.name = name;
        this.position = position;
        this.marking = marking;

        if (id >= 0) {
            this.id = id;
            if (id >= Place.idMaker)
                Place.idMaker = id + 1;
        }
        else
            this.id = Place.idMaker++;
    }
}

export class Arc {
    transition: Transition;
    place: Place;
    qty: number;

    constructor(transition: Transition, place: Place, qty: number) {
        this.transition = transition;
        this.place = place;
        this.qty = qty;
    }
}

export type JSONNet = ModelJSONType & {
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
        qty: number,
    }[],
}