"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const d3 = require("d3");
const PNet_1 = require("./PNet");
const ArrowEndpointCalculationHelper_1 = require("./EditorHelpers/ArrowEndpointCalculationHelper");
const d3_1 = require("d3");
class PNEditor {
    //#endregion
    //todo force for nearby objects(disablable in settings)
    constructor(svgElement) {
        this.selectedNode = null;
        this.selectedLink = null;
        this.mousedownLink = null;
        this.mousedownNode = null;
        this.mouseupNode = null;
        this.state = {
            selectedNode: null,
            selectedEdge: null,
            mouseDownNode: null,
            mouseDownLink: null,
            justDragged: false,
            justScaleTransGraph: false,
            lastKeyDown: -1,
            shiftNodeDrag: false,
            selectedText: null
        };
        this.html = {
            names: {
                classes: {
                    defs: {
                        arc: "defs-arc",
                        transition: "defs-transition",
                        place: "defs-place",
                        arrowTransitionEnd: "defs-arrow-t-end",
                        arrowPlaceEnd: "defs-arrow-p-end"
                    },
                    arc: "arc",
                    transition: "transition",
                    place: "place"
                }
            }
        };
        this.mouse = {
            mode: new MouseModeCls(),
            svg: {
                onClick: () => {
                    console.log("svg click");
                    const mouse = this.mouse;
                    switch (mouse.mode.main) {
                        case mainMouseModes.normal:
                            this.net.transitions.push(new PNet_1.Transition(mouse.getPosition()));
                            this.update();
                            break;
                        case mainMouseModes.arcMake:
                            const addedPlace = this.net.AddPlace(mouse.getPosition());
                            this.net.AddArc(mouse.mode.arcMakeHolder, addedPlace, 1);
                            this.mouseEndArc();
                            this.update();
                            break;
                        default:
                    }
                }
            },
            transition: {
                onClick: (t) => {
                    console.debug("transition click");
                    const mouse = this.mouse;
                    switch (mouse.mode.main) {
                        case mainMouseModes.normal:
                            this.mouseStartArc(t.position, t);
                            d3.event.stopPropagation();
                            break;
                        case mainMouseModes.arcMake:
                            this.mouseEndArc();
                            d3.event.stopPropagation();
                            break;
                        default:
                    }
                }
            },
            place: {
                onClick: (p) => {
                    const mouse = this.mouse;
                    switch (mouse.mode.main) {
                        case mainMouseModes.normal:
                            //todo: marking
                            console.log;
                            d3.event.stopPropagation();
                            break;
                        default:
                    }
                }
            },
            /** returns PNet Position relative to main svg element*/
            getPosition: () => {
                const coords = d3.mouse(this.svg.node());
                return { x: coords[0], y: coords[1] };
            }
        };
        this.svg = svgElement;
        this.net = new PNet_1.PNet();
        this.AECH = new ArrowEndpointCalculationHelper_1.AECH(this.net);
        //testing todo: smazat
        const net = this.net;
        net.places.push(new PNet_1.Place(0, "", { x: 25, y: 100 }));
        net.places.push(new PNet_1.Place(1, "", { x: 180, y: 120 }));
        net.places.push(new PNet_1.Place(2, "", { x: 260, y: 20 }));
        net.places.push(new PNet_1.Place(3, "", { x: 180, y: 20 }));
        net.places.push(new PNet_1.Place(4, "", { x: 60, y: 50 }));
        net.places.push(new PNet_1.Place(5, "", { x: 40, y: 20 }));
        net.places.push(new PNet_1.Place(6, "", { x: 200, y: 100 }));
        net.places.push(new PNet_1.Place(7, "", { x: 220, y: 20 }));
        net.transitions.push(new PNet_1.Transition({ x: 200, y: 50 }));
        net.transitions[0].arcs = [
            { place: net.places[0], qty: 10 },
            { place: net.places[1], qty: 10 },
            { place: net.places[2], qty: -10 },
            { place: net.places[3], qty: -10 },
            { place: net.places[4], qty: 10 },
            { place: net.places[5], qty: 10 },
            { place: net.places[6], qty: 10 },
            { place: net.places[7], qty: 10 },
        ];
        // initialize editor
        const svg = this.svg;
        const defs = svg.append('svg:defs');
        const state = this.state;
        const defsNames = this.html.names.classes.defs;
        const G = svg.append("g");
        this.selectors = {
            arcs: G.append("g").attr("type-arces", "").selectAll("g"),
            places: G.append("g").attr("type-places", "").selectAll("circle"),
            transitions: G.append("g").attr("type-transitions", "").selectAll("rect"),
            dragline: G.append("line")
        };
        // define arrow markers for leading arrow
        defs.append('svg:marker')
            .attr('id', defsNames.arrowTransitionEnd)
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 9)
            .attr('markerWidth', 8)
            .attr('markerHeight', 8)
            .attr('orient', 'auto')
            .append('svg:path')
            .attr('d', 'M0,-5L10,0L0,5');
        // define arrow markers for leading arrow
        defs.append('svg:marker')
            .attr('id', defsNames.arrowPlaceEnd)
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 18)
            .attr('markerWidth', 8)
            .attr('markerHeight', 8)
            .attr('orient', 'auto')
            .append('svg:path')
            .attr('d', 'M0,-5L10,0L0,5');
        defs.append("g")
            .attr("id", defsNames.place)
            .append("circle")
            .style("fill", d3_1.rgb(255, 255, 255).hex())
            .style("stroke", "black")
            .style("stroke-width", "2")
            .attr("r", 10);
        defs.append("g")
            .attr("id", defsNames.transition)
            .append("rect")
            //todo params
            .style("fill", "param(blah)" /*rgb(0, 0, 0).hex()*/)
            .attr("width", 20)
            .attr("height", 20)
            .attr("x", -10)
            .attr("y", -10);
        this.selectors.dragline
            .style("stroke", "black")
            .style("stroke-width", 1.5)
            .style("marker-mid", a => `url(#${defsNames.arrowTransitionEnd})`)
            .attr("visibility", "hidden");
        this.InitMouseEvents();
        this.update();
    }
    resetMouseVars() {
        this.mousedownNode = null;
        this.mouseupNode = null;
        this.mousedownLink = null;
    }
    /**apply changes in data to DOM */
    update() {
        const net = this.net;
        const places = this.selectors.places.data(net.places);
        const transitions = this.selectors.transitions.data(net.transitions);
        const defsNames = this.html.names.classes.defs;
        console.log("update");
        const fixNullPosition = (item) => {
            if (item.position == null)
                item.position = { x: 0, y: 0 };
        };
        places
            .enter()
            .each(fixNullPosition)
            .append("use").attr("xlink:href", `#${defsNames.place}`)
            //.append("circle")
            //.style("fill", "none")
            //.style("stroke", "black")
            //.style("stroke-width","2")
            //.attr("r", 10)
            .merge(places) // update + enter
            //.transition()
            .attr("x", function (p) { return p.position.x; })
            .attr("y", function (p) { return p.position.y; });
        transitions
            .enter()
            .each(fixNullPosition)
            .append("use").attr("xlink:href", `#${defsNames.transition}`)
            .on("click", this.mouse.transition.onClick)
            .merge(transitions) // update + enter
            .attr("x", function (t) { return t.position.x; })
            .attr("y", function (t) { return t.position.y; });
        //todo drag
        //transitions
        //    .call(d3.drag()
        //        .on("start", d => { console.log("start"); }) /*as any*/
        //        //.on("drag", () => { })
        //        //.on("end", () => { })
        //    );
        /*
        transitions
            .enter()
            .each(fixNullPosition)
            .append("rect")
            .style("fill", d3.color(d3.rgb(0, 0, 0)).hex())
            /////
            .style("fill", "none")
            .style("stroke", "black")
            .style("stroke-width","0,5")
            /////
            .attr("width", 20)
            .attr("height", 20)
           .merge(transitions) // update + enter
            .attr("x", function (t: Transition) { return t.position.x-10; })
            .attr("y", function (t: Transition) { return t.position.y-10; });
        */
        /*
        const arcData = net.transitions
            .map(t => t.arcs
                .map(a => ({ pPos: a.place.position, tPos: t.position, qty: a.qty })))
            .reduce((a, b) => a.concat(b), [])
            .map(a => (a.qty < 0) ?
                { from: a.tPos, to: a.pPos, qty: -a.qty } :
                { from: a.pPos, to: a.tPos, qty: a.qty });
        const arcs = this.selectors.arcs.data(arcData);

        arcs
            .enter()
            .append("line")
            .style("stroke", "black")
            .style("stroke-width", "1")
           .merge(arcs) // update + enter
            .attr("x1", a => a.from.x)
            .attr("y1", a => a.from.y)
            .attr("x2", a => a.to.x)
            .attr("y2", a => a.to.y);
        */
        const arcData = net.AllArces;
        const arcs = this.selectors.arcs
            .data(arcData.map(x => this.AECH.GetArcEndpoints(x)));
        arcs
            .enter()
            .append("line")
            .style("stroke", "black")
            .style("stroke-width", 1.5)
            .merge(arcs) // update + enter
            .style('marker-end', a => `url(#${a.endsIn === "T" ? defsNames.arrowTransitionEnd : defsNames.arrowPlaceEnd})`)
            .attr("x1", a => a.from.x)
            .attr("y1", a => a.from.y)
            .attr("x2", a => a.to.x)
            .attr("y2", a => a.to.y);
    }
    //#region Mouse
    InitMouseEvents() {
        this.svg.on("click", this.mouse.svg.onClick);
    }
    mouseStartArc(pos, tp) {
        this.mouse.mode.main = mainMouseModes.arcMake;
        this.mouse.mode.arcMakeHolder = tp;
        const mousePos = this.mouse.getPosition();
        this.selectors.dragline
            .attr("visibility", null)
            .attr("x1", pos.x)
            .attr("y1", pos.y)
            .attr("x2", mousePos.x)
            .attr("y2", mousePos.y);
        //todo metody start drag, stop drag
        this.svg.on("mousemove", e => {
            const mousePos = this.mouse.getPosition();
            this.selectors.dragline
                .attr("x2", mousePos.x)
                .attr("y2", mousePos.y);
        });
    }
    mouseEndArc(toMode = mainMouseModes.normal) {
        this.mouse.mode.main = toMode;
        this.mouse.mode.arcMakeHolder = null;
        this.svg.on("mousemove", null);
        this.selectors.dragline
            .attr("visibility", "hidden")
            .attr("x1", null)
            .attr("y1", null)
            .attr("x2", null)
            .attr("y2", null);
    }
}
exports.PNEditor = PNEditor;
//todo RUNMODES
var mainMouseModes;
(function (mainMouseModes) {
    mainMouseModes["normal"] = "normal";
    mainMouseModes["delete"] = "delete";
    mainMouseModes["edit"] = "edit";
    mainMouseModes["selection"] = "selection";
    mainMouseModes["multiSelect"] = "multi-selection";
    mainMouseModes["arcMake"] = "arc-make";
})(mainMouseModes || (mainMouseModes = {}));
;
class MouseModeCls {
    constructor() {
        this.main = mainMouseModes.normal;
        this.selectionHardToggle = false;
        /** holds object for creating arcs */
        this.arcMakeHolder = null;
    }
}
//# sourceMappingURL=Editor.js.map