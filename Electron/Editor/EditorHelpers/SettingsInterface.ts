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

export interface Settings {
    modes: {
        /** Main modes - must have at least one mode (default) */
        main: string[],
        /** Toggle/Switch buttons */
        toggles?:
        (string |
        {
            name: string,
            defaultState?: boolean,
            /** When is button shown */
            dependencies?: Dependencies
        })[],
    },
    actions:
    {
        on: {
            /** occured event */
            event: Events,
            /** currently selected element */
            selected?: string[],
            /** target of occured event */
            target?: string
        },
        /** if not present - event will ocur every time */
        when?: {
            /** current main mode */
            main?: string,
            toggles?: { name: string, state: boolean }[]
        },
        do?: { type: Actions, element?: DoElementTarget | string, args?: any }[],
        to?: {
            mode?: string,
            toggles?: [
                {
                    name: string,
                    changeTo: "switch" | boolean
                }
            ]
        }
    }[]
}
