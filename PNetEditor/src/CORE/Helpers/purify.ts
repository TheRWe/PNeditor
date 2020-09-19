import { d3BaseSelector } from '../../definitions/Constants';
type Position = { x: number, y: number };


export async function AsyncForeach<T>(arr: T[], fnc: (elm: T) => Promise<any>) {
    await Promise.all(arr.map(elm =>
        new Promise((resolve, reject) =>
            setTimeout(async () => {
                try {
                    await fnc(elm);
                    resolve();
                } catch (ex) {
                    reject(ex);
                }
            })
        )
    ));
}


export function RemoveAll<T>(arr: T[], removeFnc: (elm: T) => boolean) {
    let found = -1;
    while ((found = arr.findIndex(removeFnc)) !== -1) { arr.splice(found, 1); }
}

export function IsInPosition(pos1: Position, pos2: Position, elmPos: Position) {
    return ((elmPos.x < pos1.x && elmPos.x > pos2.x) || (elmPos.x > pos1.x && elmPos.x < pos2.x))
        && ((elmPos.y < pos1.y && elmPos.y > pos2.y) || (elmPos.y > pos1.y && elmPos.y < pos2.y));
}

export function notImplemented() {
    console.groupCollapsed("%cnot implemented", "background: yellow");
    console.trace();
    console.groupEnd();
}

export type EnumType = { [id: number]: string };

type fncHelpSortKeySelector<T> = ((a: T, b: T) => number);
export function SortKeySelector<TIn, TSelected>(fncSelector: (val: TIn) => TSelected): fncHelpSortKeySelector<TIn> {
    function f(a: TIn, b: TIn) {
        const valA = fncSelector(a);
        const valB = fncSelector(b);
        return valA > valB ? 1 : valA === valB ? 0 : -1;
    }
    return f;
}

export function arraysDifferences<T>(arr1: T[], arr2: T[]): { added: T[], removed: T[] } {
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

export function EnumValues(obj: EnumType): string[] {
    return (Object as any).values(obj).filter((x: any) => typeof x === 'string');
}

export class Ref<T>{
    public get value(): T {
        return this.get();
    }
    public set value(newValue: T) {
        this.set(newValue);
    }
    private readonly get: () => T;
    private readonly set: (value: T) => void;

    constructor(get: () => T, set: (value: T) => void) {
        this.get = get;
        this.set = set;
    }
}

export function flatten<T>(arr: (T[] | T)[]): T[] {
    return Array.prototype.concat(...arr);
}

export function classify<T>(srr: T[], ...fncs: ((elm: T) => boolean)[]): { element: T, classifications: boolean[] }[] {
    return srr.map(x => ({ element: x, classifications: fncs.map(f => f(x)) }));
}

/** type of class defining given type (typeof cls = Type<cls>) */
export interface Type<T> extends Function { new(...args: any[]): T; }

/**
 * source: https://codereview.stackexchange.com/questions/16124/implement-numbering-scheme-like-a-b-c-aa-ab-aaa-similar-to-converting
 */
export function convertToNumberingScheme(number: number) {
    let baseChar = ("A").charCodeAt(0),
        letters = "";

    do {
        number -= 1;
        letters = String.fromCharCode(baseChar + (number % 26)) + letters;
        number = (number / 26) >> 0; // quick `floor`
    } while (number > 0);

    return letters;
}

export function getArrayElementMapToNumber(arr: any[]) {
    return (elm: any) => {
        return arr.findIndex(x => x === elm);
    };
}

// todo: save as component file
export function MakeZoomInOutIcon(container: d3BaseSelector, type: "in" | "out") {
    const svg = container.append("svg");
    const g = svg.append("g");
    svg.style("width", "1em").style("height", "1em")
        ;
    g.style("font-size:1.4em")
        ;
    g.append("circle")
        .attr("cx", ".3em")
        .attr("cy", ".3em")
        .attr("r", ".2em")
        .attr("stroke", "black")
        .attr("stroke-width", ".045em")
        .attr("fill", "none")
        ;
    g.append("line")
        .attr("x1", ".17em")
        .attr("x2", ".42em")
        .attr("y1", ".3em")
        .attr("y2", ".3em")
        .attr("stroke", "black")
        .attr("stroke-width", ".04em")
        .attr("stroke-linecap", "round")
        ;
    if (type === "in")
        g.append("line")
            .attr("y1", ".17em")
            .attr("y2", ".42em")
            .attr("x1", ".3em")
            .attr("x2", ".3em")
            .attr("stroke", "black")
            .attr("stroke-width", ".04em")
            .attr("stroke-linecap", "round")
            ;
    g.append("line")
        .attr("y1", ".45em")
        .attr("x1", ".45em")
        .attr("y2", ".6em")
        .attr("x2", ".6em")
        .attr("stroke", "black")
        .attr("stroke-width", ".07em")
        .attr("stroke-linecap", "round")
        ;
}

export async function sleep(ms: number = 0) {
    await _sleep(ms);
}
function _sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
