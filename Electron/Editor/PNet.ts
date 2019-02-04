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

    private savedMarkings: { id: number, marking: number }[] = [];

    public SaveMarkings() {
        this.savedMarkings = this.places.map((p, i) => { return { id: p.id, marking: p.marking }; });
    }
    public LoadMarkings() {
        this.ClearMarkings();
        this.savedMarkings.forEach(m => { this.places.find((p, i) => { return m.id === p.id; }).marking = m.marking; });
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


    public toString():string
    {
        //todo: https://github.com/dsherret/ts-nameof
        let ignore: string[] = [];
        return JSON.stringify(this, (key, value) => { return ignore.indexOf(key) !== -1 ? undefined : value });
    }

    public static fromString(str: string): PNet
    {
        const obj = JSON.parse(str);
        const net = new PNet();
        return Object.assign(net, obj);
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
