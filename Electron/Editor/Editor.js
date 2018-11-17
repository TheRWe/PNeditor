"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const d3 = require("d3");
const PNet_1 = require("./PNet");
const ts_keycode_enum_1 = require("ts-keycode-enum");
const ArrowEndpointCalculationHelper_1 = require("./EditorHelpers/ArrowEndpointCalculationHelper");
const d3_1 = require("d3");
const purify_1 = require("../Helpers/purify");
// todo: invariant with force
class PNEditor {
    //#endregion
    //todo force for nearby objects(disablable in settings)
    constructor(svgElement) {
        /** helper for manipulating with html nodes*/
        this.html = {
            /** names of html entities */
            names: {
                id: {
                    g: {
                        arcs: "type-arcs",
                        places: "type-places",
                        transitions: "type-transitions"
                    }
                },
                classes: {
                    defs: {
                        arrowTransitionEnd: "defs-arrow-t-end",
                        arrowPlaceEnd: "defs-arrow-p-end"
                    },
                    arc: "arc",
                    transition: "transition",
                    place: "place"
                }
            }
        };
        /** mouse properties */
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
                            this.mouseEndArc("new");
                            this.update();
                            break;
                        case mainMouseModes.marking:
                            //todo: bude uloženo v settings
                            this.EndInputMarking(false);
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
                            this.mouseStartArc(t);
                            d3.event.stopPropagation();
                            break;
                        case mainMouseModes.arcMake:
                            this.mouseEndArc();
                            d3.event.stopPropagation();
                            break;
                        default:
                    }
                },
                /** helper class to identify ending of arcs on transitions */
                AECH: purify_1.typpedNull()
            },
            place: {
                onClick: (p) => {
                    const mouse = this.mouse;
                    switch (mouse.mode.main) {
                        case mainMouseModes.marking:
                        case mainMouseModes.normal:
                            if (p.marking == null)
                                p.marking = 0;
                            this.StartInputMarking(p);
                            d3.event.stopPropagation();
                            break;
                        default:
                    }
                }
            },
            arc: {
                onClick: (a) => {
                    const mouse = this.mouse;
                    switch (mouse.mode.main) {
                        case mainMouseModes.normal:
                            console.log("arc edit");
                            d3.event.stopPropagation();
                            break;
                        default:
                    }
                }
            },
            /** returns PNet Position relative to main svg element */
            getPosition: () => {
                const coords = d3.mouse(this.svg.node());
                return { x: coords[0], y: coords[1] };
            }
        };
        /** keyboard properties */
        this.keyboard = {
            /** input element props */
            inputs: {
                marking: {
                    /** curently edited place with marking edit input */
                    editedPlace: purify_1.typpedNull(),
                    onKeyPress: () => {
                        if (d3.event.keyCode == ts_keycode_enum_1.Key.Enter) {
                            this.EndInputMarking();
                            this.update();
                        }
                        d3.event.stopPropagation();
                    }
                }
            }
        };
        this.svg = svgElement;
        this.net = new PNet_1.PNet();
        this.mouse.transition.AECH = new ArrowEndpointCalculationHelper_1.AECH(this.net);
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
        const defsNames = this.html.names.classes.defs;
        const G = svg.append("g");
        G.append("g").attr("id", this.html.names.id.g.arcs);
        G.append("g").attr("id", this.html.names.id.g.places);
        G.append("g").attr("id", this.html.names.id.g.transitions);
        this.arcDragLine = G.append("line");
        let markingForeign = G.append("foreignObject")
            .attr("visibility", "hidden").attr("width", "100%");
        const markingDiv = markingForeign.append("xhtml:div").style("height", "50");
        this.inputMarking = {
            input: markingDiv.append("xhtml:input"),
            button: markingDiv.append("xhtml:input").attr("type", "button").attr("value", "OK").style("width", "35px"),
            foreign: markingForeign
        };
        this.inputMarking.input
            .attr("type", "number")
            .attr("min", 0)
            .attr("max", 999)
            .style("width", "40px")
            .style("height", "15px");
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
        this.arcDragLine
            .style("stroke", "black")
            .style("stroke-width", 1.5)
            .style("marker-mid", a => `url(#${defsNames.arrowTransitionEnd})`)
            .attr("visibility", "hidden");
        this.InitMouseEvents();
        this.InitKeyboardEvents();
        this.update();
    }
    // todo classed všechny možné definice budou v css
    /** apply changes in data to DOM */
    update() {
        const net = this.net;
        const defsNames = this.html.names.classes.defs;
        const places = () => d3.select("#" + this.html.names.id.g.places).selectAll("g").data(net.places);
        const transitions = () => d3.select("#" + this.html.names.id.g.transitions).selectAll("rect").data(net.transitions);
        const arcs = () => d3.select("#" + this.html.names.id.g.arcs).selectAll("line")
            .data(net.AllArces.map(x => this.mouse.transition.AECH.GetArcEndpoints(x)));
        console.log("#" + this.html.names.id.g.arcs);
        console.log("update");
        const fixNullPosition = (item) => {
            if (item.position == null)
                item.position = { x: 0, y: 0 };
        };
        const placesEnterGroup = places()
            .enter()
            .each(fixNullPosition)
            .append("g")
            .on("click", this.mouse.place.onClick)
            .classed(this.html.names.classes.place, true);
        const placesEnterCircle = placesEnterGroup.append("circle")
            .style("fill", d3_1.rgb(255, 255, 255).hex())
            .style("stroke", "black")
            .style("stroke-width", "2")
            .attr("r", 10);
        //todo: kolečka pro nízké počty
        const placesEnterText = placesEnterGroup.append("text")
            .classed("unselectable", true)
            .attr("text-anchor", "middle")
            .attr("dy", ".3em")
            .attr("font-size", 10)
            .text(d => d.marking || "");
        places()
            .attr("transform", (p) => `translate(${p.position.x}, ${p.position.y})`);
        places()
            //todo: scaling
            .select("text")
            .text(d => d.marking || "");
        transitions()
            .enter()
            .each(fixNullPosition)
            .append("rect")
            .on("click", this.mouse.transition.onClick)
            .style("fill", d3_1.rgb(0, 0, 0).hex())
            .attr("width", 20)
            .attr("height", 20)
            .attr("x", -10)
            .attr("y", -10);
        transitions()
            .attr("x", function (t) { return t.position.x - 10; })
            .attr("y", function (t) { return t.position.y - 10; });
        arcs()
            .enter()
            .append("line")
            .style("stroke", "black")
            .style("stroke-width", 1.5)
            .on("click", this.mouse.arc.onClick);
        arcs()
            .style('marker-end', a => `url(#${a.endsIn === "T" ? defsNames.arrowTransitionEnd : defsNames.arrowPlaceEnd})`)
            .attr("x1", a => a.from.x)
            .attr("y1", a => a.from.y)
            .attr("x2", a => a.to.x)
            .attr("y2", a => a.to.y)
            .exit().call(x => { console.log(x); }).remove();
        console.log(this.net);
        places().exit().remove();
        transitions().exit().remove();
    }
    //#region Mouse
    /** initialize keyboard *on* handlers related to mouse */
    InitMouseEvents() {
        this.svg.on("click", this.mouse.svg.onClick);
        this.inputMarking.input
            .on("click", () => { d3.event.stopPropagation(); });
        this.inputMarking.button
            .on("click", () => { this.EndInputMarking(); this.update(); d3.event.stopPropagation(); });
    }
    /**
     * start arc from given transition or place
     * @param tp transition or place
     */
    mouseStartArc(tp) {
        this.mouse.mode.main = mainMouseModes.arcMake;
        this.mouse.mode.arcMakeHolder = tp;
        const mousePos = this.mouse.getPosition();
        this.arcDragLine
            .attr("visibility", null)
            .attr("x1", tp.position.x)
            .attr("y1", tp.position.y)
            .attr("x2", mousePos.x)
            .attr("y2", mousePos.y);
        //todo metody start drag, stop drag
        this.svg.on("mousemove", e => {
            const mousePos = this.mouse.getPosition();
            this.arcDragLine
                .attr("x2", mousePos.x)
                .attr("y2", mousePos.y);
        });
    }
    // todo: vracet propojitelnost se zadaným objektem ?
    /**
     * end creating arc with given ending
     *  null -> no changes
     *  Transition | Place -> connect to place
     *  "new" -> creates new Place | Transition to connect
     */
    mouseEndArc(ending = null) {
        this.mouse.mode.main = this.mouse.mode.prev;
        //todo: nebezpečné, vymyslet alternativu
        this.svg.on("mousemove", null);
        this.arcDragLine
            .attr("visibility", "hidden")
            .attr("x1", null)
            .attr("y1", null)
            .attr("x2", null)
            .attr("y2", null);
        if (ending == null)
            return;
        if (ending === "new") {
            if (this.mouse.mode.arcMakeHolder instanceof PNet_1.Transition) {
                const addedPlace = this.net.AddPlace(this.mouse.getPosition());
                this.net.AddArc(this.mouse.mode.arcMakeHolder, addedPlace, 1);
            }
            else if (this.mouse.mode.arcMakeHolder instanceof PNet_1.Place) {
                //todo place making
                console.error("make transition");
            }
        }
        else {
            //todo: propojování
            console.error("connect");
        }
        this.mouse.mode.arcMakeHolder = null;
    }
    //#endregion Mouse
    //#region Keyboard
    /** initialize keyboard *on* handlers related to keyboard */
    InitKeyboardEvents() {
        this.inputMarking.input
            .on("keypress", this.keyboard.inputs.marking.onKeyPress);
    }
    /** open marking edit window for given place*/
    StartInputMarking(p) {
        this.mouse.mode.main = mainMouseModes.marking;
        this.keyboard.inputs.marking.editedPlace = p;
        this.inputMarking.foreign.attr("visibility", "visible");
        this.inputMarking.foreign.attr("x", p.position.x - 20);
        this.inputMarking.foreign.attr("y", p.position.y - 10);
        this.inputMarking.input.node().value = p.marking || null;
        this.inputMarking.input.node().focus();
    }
    /**
     * end editing place marking and close window
     * @param save changes propagate to net ?
     */
    EndInputMarking(save = true) {
        //todo: misto max hodnoty 999 bude uložená v settings a bude možnost zobrazovat hodnoty place pomocí seznamu a v place bude
        //      zobrazený pouze zástupný znak a hodnota bude v seznamu
        //todo: validace -> pokud neprojde a číslo bude třeba větší než 999 tak nepustí dál a zčervená input
        this.inputMarking.foreign.attr("visibility", "hidden");
        this.inputMarking.foreign.attr("x", null);
        this.inputMarking.foreign.attr("y", null);
        if (save) {
            let val = +this.inputMarking.input.node().value;
            console.log(val);
            this.keyboard.inputs.marking.editedPlace.marking = val;
        }
        this.keyboard.inputs.marking.editedPlace = null;
        this.mouse.mode.main = this.mouse.mode.prev;
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
    mainMouseModes["marking"] = "mark-modif";
})(mainMouseModes || (mainMouseModes = {}));
;
class MouseModeCls {
    constructor() {
        // todo: main properta a prev bude private, pokaždé když se změní main tak se nahraje do prev a bude existovat metoda co main a prev prohodí
        this.main = mainMouseModes.normal;
        this.prev = mainMouseModes.normal;
        this.selectionHardToggle = false;
        /** holds object for creating arcs */
        this.arcMakeHolder = null;
    }
}
//# sourceMappingURL=Editor.js.map