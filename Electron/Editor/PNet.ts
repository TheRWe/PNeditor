import { map, transition } from "d3";
import { flatten } from "../Helpers/purify";

export class PNet
{
    //todo: vlastní typy
    public places: Place[];
    public transitions: Transition[];

    public get AllArces(): Arc[]
    {
        return flatten(this.transitions.map(x => x.Arces))
    }

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

    public get Arces(): Arc[]
    {
        return this.arcs.map(x => ({ qty: x.qty, t: this, p: x.place }));
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

    constructor(id: number | null = null, name: string | null = null, position: Position | null = null)
    {
        this.name = name;
        this.id = id;
        this.position = position;
    }
}

export type Position = { x: number, y: number }
export type Arc = { t: Transition, p: Place, qty: number }
