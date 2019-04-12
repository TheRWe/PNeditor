﻿import * as file from 'fs';


export function notImplemented() {
    console.groupCollapsed("%cnot implemented", "background: yellow");
    console.trace();
    console.groupEnd();
}

export type EnumType = { [id: number]: string };

type fncHelpSortKeySelector<T> = ((a: T, b: T) => number);
export function SortKeySelector<TIn, TSelected>(fncSelector: (val: TIn) => TSelected): fncHelpSortKeySelector<TIn>
{
    function f(a: TIn, b: TIn)
    {
        const valA = fncSelector(a);
        const valB = fncSelector(b);
        return valA > valB ? 1 : valA === valB ? 0 : -1;
    }
    return f;
}

export function arraysDifferences<T>(arr1: T[], arr2: T[]): {added: T[], removed: T[]} {
    const added = [...arr2];
    const removed = arr1.filter((elm) => {
        const i = added.findIndex((x) => { return elm === x; });
        if (i >= 0) {
            added.splice(i, 1);
            return false;
        }
        return true;
    });

    return { added, removed };
}

export function ClassNameOf(obj: any): string {
    return obj.constructor.name;
}

export function EnumValues(obj: EnumType): string[]{
    return (Object as any).values(obj).filter((x:any) => typeof x === 'string');
}

export class Ref<T>{
    public get value(): T
    {
        return this.get();
    }
    public set value(newValue: T)
    {
        this.set(newValue);
    }
    private readonly get: () => T;
    private readonly set: (value: T) => void;

    constructor(get: () => T, set: (value: T) => void)
    {
        this.get = get;
        this.set = set;
    }
}

/** returns null as specified type - helper for declaring types in anonymous classes */
export function typedNull<T>(): T | null{
    return null;
}

export function flatten<T>(arr: (T[] | T)[]):T[]
{
    return Array.prototype.concat(...arr);
}

//todo: named tuple(univerzálně ne jenom bool)
export function classify<T>(srr: T[], ...fncs: ((elm: T) => boolean)[]): { element: T, classifications: boolean[] }[]
{
    return srr.map(x => ({ element: x, classifications: fncs.map(f => f(x)) }));
}

/** type of class defining given type (typeof cls = Type<cls>) */
export interface Type<T> extends Function { new(...args: any[]): T; }

//todo: async
export function fileExample()
{
    const fileName = "settings.json";
    let sett = {
        autosave: true,
        dafults: [1, 2, 100]
    };

    file.writeFile(fileName, JSON.stringify(sett), (err) => { if (err) console.error("error writing data"); });
    sleep(10000);
    file.readFile(fileName, { encoding: "utf8" }, (err, data: string) =>
    {
        if (err)
            console.error('failed to read');
        else
            console.log(data);
    });
}


export async function sleep(ms: number)
{
    await _sleep(ms);
}
function _sleep(ms: number)
{
    return new Promise((resolve) => setTimeout(resolve, ms));
}
