export type d3BaseSelector = d3.Selection<d3.BaseType, any, HTMLElement | d3.BaseType, any>;
export type Position = { x: number, y: number }

export const html = {
    id: {
        controlPanel: {
            buttons: {
                new: "file-button-new",
                load: "file-button-load",
                save: "file-button-save",
                close: "file-button-close",
            },
        },
        content: "content",
        PNEditor: {
            defs: {
                arrowTransitionEnd: "defs-arrow-t-end",
                arrowPlaceEnd: "defs-arrow-p-end",
            },
        },
    },
    classes: {
        controlPanel: {
            container: "panel",
            label: "panel-label",
            button: "panel-button",
            tabContainer: "panel-tab-container",
            tabButton: "panel-button-tab",
            tabSelected: "panel-button-tab-selected",
        },
        common: {
            a4: "a4size",
        },
        PNEditor: {
            helper: {
                arcVisibleLine: "arc-visible-line",
                arcHitboxLine: "arc-hitbox-line",
            },
            defs: {
                arrowTransitionEnd: "defs-arrow-t-end",
                arrowPlaceEnd: "defs-arrow-p-end",
            },
            multiSelection: {
                selectOutline: "select-outline",
                selected: "selected",
            },
            arc: { g: "arc", },
            transition: {
                g: "transition",
                epsilon: "transition-epsilon-class",
            },
            place: { g: "place", svgCircle: "placeSVGCircle" },
            g: {
                arcs: "type-arcs",
                places: "type-places",
                transitions: "type-transitions",
            },
        },
        ReachabilityGraph: {
            states: "g-states",
            transitions: "g-reachability-transitions",
        },
        ToggleSwitch: {
            switcher: "switcher",
            labelOff: "switcher-label-off",
            labelOn: "switcher-label-on",
        },
    },
}

export const numbers = {
    /** vysoké celé číslo symbolizující hodnotu omega */
    omega: 9007199254740666,
}

export interface ForceNode {
    index: number;
    vx: number;
    vy: number;
    x: number;
    y: number;
    fx: number;
    fy: number;
}
