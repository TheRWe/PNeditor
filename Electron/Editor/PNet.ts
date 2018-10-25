export class PNet
{
    //todo: vlastní typy
    public places: Place[];
    public transition: Transition[];

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
        this.transition = [];
    }
}

export class Transition
{
    public arcs: { place: Place, qty: number }[];
    public position: Position | null;

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