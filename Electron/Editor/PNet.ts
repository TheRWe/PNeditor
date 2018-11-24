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


    //#region Modifications

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

    /** returns arc with transaction to work independent od this object */
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
