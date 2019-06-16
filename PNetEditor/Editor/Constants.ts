export type d3BaseSelector = d3.Selection<d3.BaseType, any, HTMLElement, any>;
export type Position = { x: number, y: number }

export const html = {
    id: {

    },
    classes: {
        page: {
            controlPanelTabs: "control-panel-tabs",
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
    },
}