import { map, transition } from "d3";
import { flatten, Ref } from "../Helpers/purify";

export class PNet
{
    public places: Place[];
    public transitions: Transition[];

    public get AllArces(): Arc[]
    {
        return flatten(this.transitions.map(x => x.ArcesIndependent))
    }


    //#region Edit Modifications

    private placeID = 0;
    public AddPlace(pos: Position, name: string = null): Place
    {
        const place = new Place(this.placeID++, name, pos);
        this.places.push(place);
        return place;
    }

    public AddArc(t: Transition, p: Place, qty: number)
    {
        t.arcs.push({ place: p, qty: qty});
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

    public IsTransitionEnabled(transition: Transition | null): boolean {
        return transition != null && transition.arcs.every(v => (v.qty + v.place.marking) >= 0);
    }
    public get EnabledTransitions(): Transition[] {
        return this.transitions.filter(t => this.IsTransitionEnabled(t));
    }

    public RunTransition(transition: Transition): boolean {
        if (!this.IsTransitionEnabled(transition))
            return false;
        transition.arcs.forEach(a => { a.place.marking += a.qty });
        return true;
    }

	//#endregion


    public toString(): string
    {
        // todo: https://github.com/dsherret/ts-nameof
        // todo: změna id
        // todo: možnost ukládat pouze name bez id pokud je name unikátní
        // todo: kontrola že se name neukládá pokud je "" | null | undefined
        const places: { name?: string, id: number, position?: Position, marking?: number }[]
            = this.places.map(p => { return { name: p.name, id: p.id, position: p.position, marking: p.marking }; });

        const savedMarkings: { place_id: number, marking: number }[]
            = this.savedMarkings.map(m => { return { place_id: m.place.id, marking: m.marking }; });

        const transitions: { arcs: { place_id: number, qty: number }[], position?: Position }[]
            = this.transitions.map(t => { return { position: t.position, arcs: t.arcs.map(a => { return { place_id: a.place.id, qty: a.qty } }) } });


        const json: JSONNet = { places: places, savedMarkings: savedMarkings, transitions: transitions };

        return JSON.stringify(json, null, 4);
    }

    public static fromString(str: string): PNet
    {
        const obj: JSONNet = JSON.parse(str);

        // todo: validace
        // todo: možnost používat name místo id
        const places: Place[] = obj.places.map(p => new Place(p.id, p.name, p.position, p.marking))

        const transitions: Transition[] = obj.transitions.map(tj => {
            const t = new Transition(tj.position);
            t.arcs = tj.arcs.map(aj => { return { place: places.find(p => p.id === aj.place_id), qty: aj.qty } })
            return t;
        })

        const savedMarkings: { place: Place, marking: number }[] = obj.savedMarkings.map(smj => {
            return { place: places.find(p => p.id === smj.place_id), marking: smj.marking };
        });

        const placeID: number = Math.max(-1, ...places.map(p => p.id)) + 1;

        return Object.assign(new PNet(), { places: places, transitions: transitions, savedMarkings: savedMarkings, placeID: placeID });
    }

    constructor()
    {
        this.places = [];
        this.transitions = [];
    }
}

export class Transition
{
    public position: Position | null;
    public arcs: { place: Place, qty: number }[];

    /** returns arc with transaction to work independent on this object */
    public get ArcesIndependent(): Arc[]
    {
        return this.arcs.map(x => ({ qty: new Ref<number>(() => x.qty, (v) => x.qty = v), t: this, p: x.place }));
    }

    constructor(position: Position | null = null)
    {
        this.arcs = [];
        this.position = position;
    }
}

export class Place
{
    public name: string | null;
    public id: number | null;
    public position: Position | null;
    public marking: number | null;

    constructor(id: number | null = null, name: string | null = null, position: Position | null = null, marking: number | null = null)
    {
        this.name = name;
        this.id = id;
        this.position = position;
        this.marking = marking;
    }
}

export type Position = { x: number, y: number }
export type Arc = { t: Transition, p: Place, qty: Ref<number> }

type JSONNet = {
    savedMarkings:
        { place_id: number, marking: number }[],
    places:
        { name?: string, id: number, position?: Position, marking?: number }[],
    transitions: {
            arcs:
                { place_id: number, qty: number }[],
            position?: Position
        }[]
}
