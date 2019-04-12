export enum Events { "Click" }
export enum Actions { "add", "remove", "edit", "move", "do" }
export type DoElementTarget = ("target" | "selected")[];

export type Dependencies = {
    main?: string,
    toggles?: { name: string, value: boolean }[]
}

export interface DataModel<JSONType extends {}> {
    toJSON(): JSONType;
    fromJSON(json: JSONType): void;
    elementNames(): string[];
}

export interface DrawModel {
    drawElements(elements: any[], selectionGenerator: () => d3.Selection<d3.BaseType, {}, HTMLElement, any>, elmName: string): void;
}