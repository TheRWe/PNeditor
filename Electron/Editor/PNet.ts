import { flatten, Ref, EnumValues, ClassNameOf } from "../Helpers/purify";

export class PNet {



    public places: Place[];
    public transitions: Transition[];
    public arcs: Arc[];


    //#region Edit Modifications

    public AddPlace(pos: Position, name: string = null): Place {
        const place = new Place(name, pos);
        this.places.push(place);
        return place;
    }

    public AddArc(t: Transition, p: Place, qty: number) {
        this.arcs.push(new Arc(t, p, qty));
    }

    //#endregion


    //#region Running methods

    private savedMarkings: { place: Place, marking: number }[] = [];

    public SaveMarkings() {
        this.savedMarkings = this.places.map((p, i) => { return { place: p, marking: p.marking }; });
    }
    public LoadMarkings() {
        this.ClearMarkings();
        this.savedMarkings.forEach(m => { m.place.marking = m.marking });
    }
    public ClearMarkings() {
        this.places.forEach(p => { p.marking = 0; });
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

    public RunTransition(transition: Transition): boolean {
        if (!this.IsTransitionEnabled(transition))
            return false;
        this.getArcesOfTransition(transition).forEach(a => { a.place.marking += a.qty });
        return true;
    }

    //#endregion


    public toString(): string {
        // todo: https://github.com/dsherret/ts-nameof
        // todo: změna id
        // todo: možnost ukládat pouze name bez id pokud je name unikátní
        // todo: kontrola že se name neukládá pokud je "" | null | undefined
        const places: { name?: string, id: number, position?: Position, marking?: number }[]
            = this.places.map(p => { return { name: p.name, id: p.id, position: p.position, marking: p.marking }; });

        const savedMarkings: { place_id: number, marking: number }[]
            = this.savedMarkings.map(m => { return { place_id: m.place.id, marking: m.marking }; });

        const transitions: { position?: Position, id: number }[]
            = this.transitions.map(t => { return { position: t.position, id: t.id } });

        const arcs: { place_id: number, transition_id: number, qty: number }[]
            = this.arcs.map(a => { return { place_id: a.place.id, transition_id: a.transition.id, qty: a.qty }; });

        const json: JSONNet = { places: places, savedMarkings: savedMarkings, transitions: transitions, arcs: arcs };

        return JSON.stringify(json, null, 4);
    }

    public static fromString(str: string): PNet {
        const obj: JSONNet = JSON.parse(str);

        // todo: validace
        // todo: možnost používat name místo id
        const places: Place[] = obj.places.map(p => new Place(p.name, p.position, p.marking, p.id))

        const transitions: Transition[] = obj.transitions.map(tj => {
            const t = new Transition(tj.position, tj.id);
            return t;
        })

        const arcs = obj.arcs.map(aj => new Arc(transitions.find(t => t.id === aj.place_id), places.find(p => p.id === aj.place_id), aj.qty));

        const savedMarkings: { place: Place, marking: number }[] = obj.savedMarkings.map(smj => {
            return { place: places.find(p => p.id === smj.place_id), marking: smj.marking };
        });

        const placeID: number = Math.max(-1, ...places.map(p => p.id)) + 1;

        return Object.assign(new PNet(), { places: places, transitions: transitions, savedMarkings: savedMarkings, placeID: placeID, arcs: arcs });
    }

    constructor() {
        this.places = [];
        this.transitions = [];
        this.arcs = [];
    }
}

export class Transition {
    public position: Position | null;

    //todo: o id a odkazování se bude starat ukládání a načítání
    public readonly id: number;
    private static idMaker = 0;

    constructor(position: Position | null = null, id?: number) {
        this.position = position;
        if (id)
            this.id = id
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

    constructor(name: string | null = null, position: Position | null = null, marking: number | null = null, id?: number) {
        this.name = name;
        this.position = position;
        this.marking = marking;

        if (id)
            this.id = id
        else
            this.id = Place.idMaker++;
    }
}

export type Position = { x: number, y: number }
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

type JSONNet = {
    savedMarkings:
    {
        place_id: number,
        marking: number
    }[],
    places:
    {
        name?: string,
        id: number,
        position?: Position,
        marking?: number
    }[],
    transitions: {
        id: number,
        position?: Position
    }[],
    arcs: {
        transition_id: number,
        place_id: number,
        qty: number
    }[],
}
