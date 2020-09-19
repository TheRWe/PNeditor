import { d3BaseSelector } from "../../definitions/Constants";
type Position = { x: number, y: number };


export const AsyncForeach = async<T>(arr: T[], fnc: (elm: T) => Promise<any>) => {
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
};


export const RemoveAll = <T>(arr: T[], removeFnc: (elm: T) => boolean) => {
  let found = -1;
  while (found !== -1) {
    // TODO: findIndex called in every iteration inefective
    found = arr.findIndex(removeFnc);
    arr.splice(found, 1);
  }
};

export const IsInPosition = (pos1: Position, pos2: Position, elmPos: Position) => {
  return ((elmPos.x < pos1.x && elmPos.x > pos2.x) || (elmPos.x > pos1.x && elmPos.x < pos2.x))
    && ((elmPos.y < pos1.y && elmPos.y > pos2.y) || (elmPos.y > pos1.y && elmPos.y < pos2.y));
};

export const notImplemented = () => {
  // tslint:disable: no-console
  console.groupCollapsed("%cnot implemented", "background: yellow");
  console.trace();
  console.groupEnd();
  // tslint:enable: no-console
};

export type EnumType = { [id: number]: string };

type fncHelpSortKeySelector<T> = ((a: T, b: T) => number);
export const SortKeySelector = <TIn, TSelected>(fncSelector: (val: TIn) => TSelected): fncHelpSortKeySelector<TIn> => {
  const f = (a: TIn, b: TIn) => {
    const valA = fncSelector(a);
    const valB = fncSelector(b);
    return valA > valB ? 1 : valA === valB ? 0 : -1;
  };
  return f;
};

export const arraysDifferences = <T>(arr1: T[], arr2: T[]): { added: T[], removed: T[] } => {
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
};

export const ClassNameOf = (obj: any): string => {
  return obj.constructor.name;
};

export const EnumValues = (obj: EnumType): string[] => {
  return (Object as any).values(obj).filter((x: any) => typeof x === "string");
};

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

export const flatten = <T>(arr: (T[] | T)[]): T[] => {
  return Array.prototype.concat(...arr);
};

export const classify = <T>(srr: T[], ...fncs: ((elm: T) => boolean)[])
  : { element: T, classifications: boolean[] }[] => {
  return srr.map(x => ({ element: x, classifications: fncs.map(f => f(x)) }));
};

/** type of class defining given type (typeof cls = Type<cls>) */
export type Type<T> = new (...args: any[]) => T;

/**
 * source: https://codereview.stackexchange.com/questions/16124/implement-numbering-scheme-like-a-b-c-aa-ab-aaa-similar-to-converting
 */
export const convertToNumberingScheme = (value: number) => {
  const baseChar = ("A").charCodeAt(0);
  let letters = "";
  let rest = value;
  const base = 26;

  do {
    rest -= 1;
    letters = String.fromCharCode(baseChar + (rest % base)) + letters;
    // tslint:disable-next-line: no-bitwise
    rest = (rest / base) >> 0; // quick `floor`
  } while (rest > 0);

  return letters;
};

export const getArrayElementMapToNumber = (arr: any[]) => {
  return (elm: any) => {
    return arr.findIndex(x => x === elm);
  };
};

// todo: save as component file
export const MakeZoomInOutIcon = (container: d3BaseSelector, type: "in" | "out") => {
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
};

export const sleep = async (ms: number = 0) => {
  await new Promise(r=>setTimeout(r, ms));
};
