import { DataModel } from "./EditorHelpers/SettingsInterface";

export class PNet implements DataModel<JSONNet> {

    public places: Place[];
    public transitions: Transition[];
    public arcs: Arc[];

    //#region History

    private netHistory: JSONNet[] = [];
    private netHistoryIndex = -1;

    private setHistory() {
        console.debug({ a: this.netHistory, i: this.netHistoryIndex });
        this.fromJSON(this.netHistory[this.netHistoryIndex]);
    }

    public AddHist() {
        this.netHistoryIndex++;
        this.netHistory[this.netHistoryIndex] = this.toJSON();
        this.netHistory = this.netHistory.slice(0, this.netHistoryIndex + 1);
    }

    public Redo() {
        if (!(this.netHistoryIndex + 1 < this.netHistory.length))
            return;
        this.netHistoryIndex++;
        this.setHistory();
    }

    public Undo() {
        if (this.netHistoryIndex <= 0)
            return;
        this.netHistoryIndex--;
        this.setHistory();
    }

	//#endregion


    //#region Edit Modifications

    public AddPlace(pos: Position, name: string = null): Place {
        const place = new Place(name, pos);
        this.places.push(place);
        this.AddHist();
        return place;
    }

    public AddArc(t: Transition, p: Place, qty: number) {
        console.debug({ t, p });
        this.arcs.push(new Arc(t, p, qty));
        this.AddHist();
    }

    public AddTransition(pos: Position) {
        this.transitions.push(new Transition(pos));
        this.AddHist();
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
        this.AddHist();
        return true;
    }

    //#endregion


    public elementNames(): string[] {
        var elementNames: PNetElementNames[] = ["place", "transition", "arc"];
        return elementNames;
    }

    public toJSON(): JSONNet {
        // todo: https://github.com/dsherret/ts-nameof
        // todo: změna id
        // todo: možnost ukládat pouze name bez id pokud je name unikátní
        // todo: kontrola že se name neukládá pokud je "" | null | undefined
        const places: { name?: string, id: number, position?: Position, marking?: number }[]
            = this.places.map(p => { return { name: p.name, id: p.id, position: { ...p.position }, marking: p.marking }; });

        const savedMarkings: { place_id: number, marking: number }[]
            = this.savedMarkings.map(m => { return { place_id: m.place.id, marking: m.marking }; });

        const transitions: { position?: Position, id: number }[]
            = this.transitions.map(t => { return { position: { ...t.position }, id: t.id } });

        const arcs: { place_id: number, transition_id: number, qty: number }[]
            = this.arcs.map(a => { return { place_id: a.place.id, transition_id: a.transition.id, qty: a.qty }; });

        const json: JSONNet = { places: places, savedMarkings: savedMarkings, transitions: transitions, arcs: arcs };

        return json;
    }

    public fromJSON(json: JSONNet) {
        // todo: validace
        // todo: možnost používat name místo id
        const places: Place[] = json.places.map(p => new Place(p.name, p.position, p.marking, p.id))

        const transitions: Transition[] = json.transitions.map(tj => {
            const t = new Transition(tj.position, tj.id);
            return t;
        })

        const arcs = json.arcs.map(aj => new Arc(transitions.find(t => t.id === aj.transition_id), places.find(p => p.id === aj.place_id), aj.qty));

        const savedMarkings: { place: Place, marking: number }[] = json.savedMarkings.map(smj => {
            return { place: places.find(p => p.id === smj.place_id), marking: smj.marking };
        });

        const placeID: number = Math.max(-1, ...places.map(p => p.id)) + 1;

        return Object.assign(this, { places: places, transitions: transitions, savedMarkings: savedMarkings, placeID: placeID, arcs: arcs });
    }

    constructor() {
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

export type PNetElementNames = "place" | "transition" | "arc"

type JSONNet = {
    savedMarkings:
    {
        place_id: number,
        marking: number,
    }[],
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
