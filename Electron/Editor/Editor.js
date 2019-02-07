"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const d3 = require("d3");
const PNet_1 = require("./PNet");
const ts_keycode_enum_1 = require("ts-keycode-enum");
const ArrowEndpointCalculationHelper_1 = require("./EditorHelpers/ArrowEndpointCalculationHelper");
const d3_1 = require("d3");
const purify_1 = require("../Helpers/purify");
const file = require("fs");
// todo: definice rozdělit do souborů (class extend/ definice metod bokem pomocí (this: cls))
// todo: invariant with force
class PNEditor {
    //#endregion
    //#region Constructor
    //todo force for nearby objects(disablable in settings)
    constructor(divElement) {
        //#region File
        // todo: ukládat do app.getPath('userData')
        // todo: implicitní verzování ?
        this.autoSavePath = "autoSavedNet.pnet.json";
        //#endregion
        //#region HTML
        /** helper for manipulating with html nodes*/
        this.html = {
            /** D3 selectors for elements */
            selectors: {
                /** main div element */
                div: purify_1.typedNull(),
                /** svg PN view */
                svg: purify_1.typedNull(),
                /** control buttons - holders */
                controlBar: {
                    /** div */
                    baseDiv: purify_1.typedNull(),
                    /** always shown buttons */
                    main: {
                        div: purify_1.typedNull(),
                    },
                    /** run dependent butons */
                    run: {
                        div: purify_1.typedNull(),
                    },
                    /** edit dependent butons */
                    edit: {
                        div: purify_1.typedNull(),
                    }
                },
                arcDragLine: purify_1.typedNull(),
            },
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
                    helper: {
                        arcVisibleLine: "arc-visible-line",
                        arcHitboxLine: "arc-hitbox-line",
                    },
                    defs: {
                        arrowTransitionEnd: "defs-arrow-t-end",
                        arrowPlaceEnd: "defs-arrow-p-end"
                    },
                    arc: { g: "arc" },
                    transition: { g: "transition" },
                    place: { g: "place", svgCircle: "placeSVGCircle" }
                }
            }
        };
        /** mouse properties */
        this.mouse = {
            mode: new MouseModeCls(),
            svg: {
                onClick: () => {
                    const mouse = this.mouse;
                    switch (mouse.mode.main) {
                        case mainMouseModes.normal:
                            this.net.transitions.push(new PNet_1.Transition(mouse.svg.getPosition()));
                            this.update();
                            break;
                        case mainMouseModes.arcMake:
                            this.mouseEndArc("new");
                            this.update();
                            break;
                        case mainMouseModes.valueEdit:
                            //todo: bude uloženo v settings
                            this.EndInputMarking(false);
                            this.EndInputArc(false);
                            break;
                        default:
                    }
                },
                /** returns PNet Position relative to main svg element */
                getPosition: () => {
                    const coords = d3.mouse(this.html.selectors.svg.node());
                    return { x: coords[0], y: coords[1] };
                }
            },
            controlBar: {
                main: {
                    runToggle: {
                        onChange: (_, i, nodes) => {
                            const elm = d3.select(nodes[i]);
                            const checked = elm.property("checked");
                            this.mouse.controlBar.main.runToggle.onCheckedChange(checked);
                        },
                        onCheckedChange: (checked) => {
                            const controlBarRun = this.html.selectors.controlBar.run.div
                                .style("display", "none");
                            const controlBarEdit = this.html.selectors.controlBar.edit.div
                                .style("display", "none");
                            if (checked) {
                                controlBarRun
                                    .style("display", "inline-block");
                            }
                            else {
                                controlBarEdit
                                    .style("display", "inline-block");
                            }
                        }
                    }
                }
            },
            transition: {
                onClick: (t) => {
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
                }
            },
            place: {
                onClick: (p) => {
                    const mouse = this.mouse;
                    switch (mouse.mode.main) {
                        case mainMouseModes.valueEdit:
                        case mainMouseModes.normal:
                            if (p.marking == null)
                                p.marking = 0;
                            this.EndInputMarking(false);
                            this.EndInputArc(false);
                            this.StartInputMarking(p);
                            d3.event.stopPropagation();
                            break;
                        default:
                    }
                }
            },
            arc: {
                onClickHitbox: (a) => {
                    const mouse = this.mouse;
                    switch (mouse.mode.main) {
                        case mainMouseModes.valueEdit:
                        case mainMouseModes.normal:
                            this.EndInputMarking(false);
                            this.EndInputArc(false);
                            this.StartInputArc(a);
                            d3.event.stopPropagation();
                            break;
                        default:
                    }
                }
            },
        };
        /** keyboard properties */
        this.keyboard = {
            /** input element props */
            inputs: {
                marking: {
                    /** curently edited place with marking edit input */
                    editedPlace: purify_1.typedNull(),
                    onKeyPress: () => {
                        if (d3.event.keyCode == ts_keycode_enum_1.Key.Enter) {
                            this.EndInputMarking();
                            this.update();
                        }
                        d3.event.stopPropagation();
                    },
                    /** marking editor input */
                    selectors: {
                        foreign: purify_1.typedNull(),
                        input: purify_1.typedNull(),
                        buttonOK: purify_1.typedNull()
                    },
                },
                arcValue: {
                    /** curently edited arc with value edit input */
                    editedArc: purify_1.typedNull(),
                    onKeyPress: () => {
                        if (d3.event.keyCode == ts_keycode_enum_1.Key.Enter) {
                            this.EndInputArc();
                            this.update();
                        }
                        d3.event.stopPropagation();
                    },
                    /** marking editor input */
                    selectors: {
                        foreign: purify_1.typedNull(),
                        input: purify_1.typedNull(),
                        button: purify_1.typedNull()
                    },
                }
            }
        };
        this.html.selectors.div = divElement;
        //#region Controlbar
        const controlbarBase = this.html.selectors.controlBar.baseDiv =
            divElement.append("div")
                .style("height", "30px")
                .style("background", d3_1.rgb(223, 223, 223).hex());
        const controlbarMain = this.html.selectors.controlBar.main.div = controlbarBase.append("div")
            //to show none -> inline-block
            .style("display", "inline-block")
            .style("margin", "5px 5px");
        this.html.selectors.controlBar.edit.div = controlbarBase.append("div")
            .style("margin", "5px 5px")
            .style("display", "inline-block");
        this.html.selectors.controlBar.run.div = controlbarBase.append("div")
            .style("margin", "5px 5px")
            .style("display", "none");
        //#region RunToggle
        const controlbarMainRunToggle = controlbarMain.append("div")
            .classed("onoffswitch", true);
        controlbarMainRunToggle.append("input")
            .attr("type", "checkbox")
            .attr("name", "onoffswitch")
            .classed("onoffswitch-checkbox", true)
            .attr("id", "myonoffswitch")
            .on("change", this.mouse.controlBar.main.runToggle.onChange);
        const controlbarMainRunToggleLabel = controlbarMainRunToggle.append("label")
            .classed("onoffswitch-label", true)
            .attr("for", "myonoffswitch");
        controlbarMainRunToggleLabel.append("span")
            .classed("onoffswitch-inner", true);
        controlbarMainRunToggleLabel.append("span")
            .classed("onoffswitch-switch", true);
        //#endregion
        //#endregion
        //#region Initialize SVG-HTML
        const svg = this.html.selectors.svg = divElement
            .append("svg")
            .attr("width", "100%")
            .attr("height", 600);
        const defs = svg.append('svg:defs');
        const defsNames = this.html.names.classes.defs;
        const G = svg.append("g");
        G.append("g").attr("id", this.html.names.id.g.arcs);
        G.append("g").attr("id", this.html.names.id.g.places);
        G.append("g").attr("id", this.html.names.id.g.transitions);
        this.html.selectors.arcDragLine = G.append("line");
        let markingForeign = G.append("foreignObject")
            .attr("visibility", "hidden").attr("width", "100%");
        const markingDiv = markingForeign.append("xhtml:div").style("height", "50");
        const inputMarking = this.keyboard.inputs.marking.selectors;
        inputMarking.input = markingDiv.append("xhtml:input");
        inputMarking.buttonOK = markingDiv.append("xhtml:input").attr("type", "button").attr("value", "OK").style("width", "35px");
        inputMarking.foreign = markingForeign;
        inputMarking.input
            .attr("type", "number")
            .attr("min", 0)
            .attr("max", 999)
            .style("width", "40px")
            .style("height", "15px");
        let arcValueForeign = G.append("foreignObject")
            .attr("visibility", "hidden").attr("width", "100%");
        const arcValueDiv = arcValueForeign.append("xhtml:div").style("height", "50");
        const inputArcValue = this.keyboard.inputs.arcValue.selectors;
        inputArcValue.input = arcValueDiv.append("xhtml:input");
        inputArcValue.button = arcValueDiv.append("xhtml:input").attr("type", "button").attr("value", "OK").style("width", "35px");
        inputArcValue.foreign = arcValueForeign;
        inputArcValue.input
            .attr("type", "number")
            .attr("min", -999)
            .attr("max", 999)
            .style("width", "45px")
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
        this.html.selectors.arcDragLine
            .style("stroke", "black")
            .style("stroke-width", 1.5)
            .style("marker-mid", a => `url(#${defsNames.arrowTransitionEnd})`)
            .attr("visibility", "hidden");
        //#endregion
        this.InitMouseEvents();
        this.InitKeyboardEvents();
        if (!this.AutoLoad()) {
            this.net = new PNet_1.PNet();
            this.update();
        }
    }
    AutoSave() { return this.Save(this.autoSavePath); }
    AutoLoad() { return this.Load(this.autoSavePath); }
    /** Saves current net to given path */
    Save(path) {
        const stringJSON = this.net.toString();
        try {
            file.writeFileSync(path, stringJSON, { encoding: "utf8" });
        }
        catch (_a) {
            return false;
        }
        console.log("%c net SAVED", "color: rgb(0, 0, 255)");
        return true;
    }
    /** load net from given path */
    Load(path) {
        let objString;
        try {
            objString = file.readFileSync(path, { encoding: "utf8" });
        }
        catch (_a) {
            return false;
        }
        // todo: lepším způsobem zaručit animace(bez NewNet)
        this.NewNet();
        this.net = PNet_1.PNet.fromString(objString);
        console.log("%c LOADED net", "color: rgb(0, 0, 255)");
        console.log(this.net);
        this.update();
        return true;
    }
    // todo: záložky ?
    NewNet() {
        this.net = new PNet_1.PNet();
        this.update();
    }
    //#endregion
    //#region Update
    // todo classed všechny možné definice budou v css
    /** apply changes in data to DOM */
    update() {
        const net = this.net;
        console.debug("%c update", "color: rgb(0, 160, 160)");
        const defsNames = this.html.names.classes.defs;
        const places = () => d3.select("#" + this.html.names.id.g.places).selectAll("g").data(net.places);
        const transitions = () => d3.select("#" + this.html.names.id.g.transitions).selectAll("rect").data(net.transitions);
        const arcs = () => d3.select("#" + this.html.names.id.g.arcs).selectAll("g")
            .data(net.AllArces.map(x => { return { arc: x, line: ArrowEndpointCalculationHelper_1.GetArcEndpoints(x) }; }));
        const fixNullPosition = (item) => {
            if (item.position == null)
                item.position = { x: 0, y: 0 };
        };
        const placesEnterGroup = places()
            .enter()
            .each(fixNullPosition)
            .append("g")
            .on("click", this.mouse.place.onClick)
            .classed(this.html.names.classes.place.g, true);
        const placesEnterCircle = placesEnterGroup.append("circle")
            .style("fill", d3_1.rgb(255, 255, 255).hex())
            .style("stroke", "black")
            .style("stroke-width", "2")
            .attr("r", 10)
            .classed(this.html.names.classes.place.svgCircle, true);
        //todo: kolečka pro nízké počty
        const placesEnterText = placesEnterGroup.append("text")
            .classed("unselectable", true)
            .attr("text-anchor", "middle")
            .attr("dy", ".3em")
            .attr("font-size", 10)
            .text(d => d.marking || "")
            .classed("txt", true);
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
            .attr("y", function (t) { return t.position.y - 10; })
            .style("fill", t => net.IsTransitionEnabled(t) ? d3_1.rgb(0, 128, 0).hex() : d3_1.rgb(0, 0, 0).hex());
        const enterArc = arcs()
            .enter()
            .append("g");
        enterArc
            .append("line")
            .classed(this.html.names.classes.helper.arcVisibleLine, true)
            .style("stroke", "black")
            .style("stroke-width", 1.5);
        enterArc
            .append("line")
            .classed(this.html.names.classes.helper.arcHitboxLine, true)
            .style("stroke", "black")
            .attr("opacity", "0")
            .style("stroke-width", 8)
            .on("click", (x) => this.mouse.arc.onClickHitbox(x.arc));
        enterArc
            .append("text")
            .classed("unselectable", true)
            .attr("text-anchor", "middle")
            .attr("dy", ".3em")
            .attr("font-size", 10)
            .on("click", (x) => this.mouse.arc.onClickHitbox(x.arc));
        arcs().select(`.${this.html.names.classes.helper.arcVisibleLine}`)
            .style('marker-end', a => `url(#${a.line.endsIn === "T" ? defsNames.arrowTransitionEnd : defsNames.arrowPlaceEnd})`)
            .attr("x1", a => a.line.from.x)
            .attr("y1", a => a.line.from.y)
            .attr("x2", a => a.line.to.x)
            .attr("y2", a => a.line.to.y);
        arcs().select(`.${this.html.names.classes.helper.arcHitboxLine}`)
            .attr("x1", a => a.line.from.x)
            .attr("y1", a => a.line.from.y)
            .attr("x2", a => a.line.to.x)
            .attr("y2", a => a.line.to.y);
        //todo: obravování -> pokud šipka z place tak červená jinak zelená (obarvit ají šipku)
        arcs().select('text')
            .attr("x", a => Math.abs(a.line.to.x - a.line.from.x) / 2 + Math.min(a.line.to.x, a.line.from.x) - 5)
            .attr("y", a => Math.abs(a.line.to.y - a.line.from.y) / 2 + Math.min(a.line.to.y, a.line.from.y) - 5)
            .text(d => Math.abs(d.arc.qty.value) || "");
        arcs().exit().call(x => { console.debug({ removing: x }); }).remove();
        places().exit().remove();
        transitions().exit().remove();
    }
    //#endregion
    //#region Mouse
    /** initialize keyboard *on* handlers related to mouse */
    InitMouseEvents() {
        this.html.selectors.svg.on("click", this.mouse.svg.onClick);
        const inputMarking = this.keyboard.inputs.marking.selectors;
        inputMarking.input
            .on("click", () => { d3.event.stopPropagation(); });
        inputMarking.buttonOK
            .on("click", () => { this.EndInputMarking(); this.update(); d3.event.stopPropagation(); });
        const arcValueMarking = this.keyboard.inputs.arcValue.selectors;
        arcValueMarking.input
            .on("click", () => { d3.event.stopPropagation(); });
        arcValueMarking.button
            .on("click", () => { this.EndInputArc(); this.update(); d3.event.stopPropagation(); });
    }
    /**
     * start arc from given transition or place
     * @param tp transition or place
     */
    mouseStartArc(tp) {
        this.mouse.mode.main = mainMouseModes.arcMake;
        this.mouse.mode.arcMakeHolder = tp;
        const mousePos = this.mouse.svg.getPosition();
        this.html.selectors.arcDragLine
            .attr("visibility", null)
            .attr("x1", tp.position.x)
            .attr("y1", tp.position.y)
            .attr("x2", mousePos.x)
            .attr("y2", mousePos.y);
        //todo metody start drag, stop drag
        this.html.selectors.svg.on("mousemove", e => {
            const mousePos = this.mouse.svg.getPosition();
            this.html.selectors.arcDragLine
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
        this.html.selectors.svg.on("mousemove", null);
        this.html.selectors.arcDragLine
            .attr("visibility", "hidden")
            .attr("x1", null)
            .attr("y1", null)
            .attr("x2", null)
            .attr("y2", null);
        if (ending == null)
            return;
        if (ending === "new") {
            if (this.mouse.mode.arcMakeHolder instanceof PNet_1.Transition) {
                const addedPlace = this.net.AddPlace(this.mouse.svg.getPosition());
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
        this.keyboard.inputs.marking.selectors.input
            .on("keypress", this.keyboard.inputs.marking.onKeyPress);
        this.keyboard.inputs.arcValue.selectors.input
            .on("keypress", this.keyboard.inputs.arcValue.onKeyPress);
    }
    /** open marking edit window for given place*/
    StartInputArc(a) {
        this.mouse.mode.main = mainMouseModes.valueEdit;
        this.keyboard.inputs.arcValue.editedArc = a;
        const inputArc = this.keyboard.inputs.arcValue.selectors;
        inputArc.foreign.attr("visibility", "visible");
        const mousePos = this.mouse.svg.getPosition();
        inputArc.foreign.attr("x", mousePos.x - 20);
        inputArc.foreign.attr("y", mousePos.y - 10);
        inputArc.input.node().value = a.qty.value;
        inputArc.input.node().focus();
    }
    /**
     * end editing arc value and close window
     * @param save changes propagate to net ?
     */
    EndInputArc(save = true) {
        //todo: misto max hodnoty 999 bude uložená v settings a bude možnost zobrazovat hodnoty place pomocí seznamu a v place bude
        //      zobrazený pouze zástupný znak a hodnota bude v seznamu
        //todo: validace -> pokud neprojde a číslo bude třeba větší než 999 tak nepustí dál a zčervená input
        const inputArc = this.keyboard.inputs.arcValue.selectors;
        inputArc.foreign.attr("visibility", "hidden");
        inputArc.foreign.attr("x", null);
        inputArc.foreign.attr("y", null);
        if (save) {
            let val = +inputArc.input.node().value;
            this.keyboard.inputs.arcValue.editedArc.qty.value = val;
        }
        this.keyboard.inputs.marking.editedPlace = null;
        this.mouse.mode.main = this.mouse.mode.prev;
    }
    /** open marking edit window for given place*/
    StartInputMarking(p) {
        this.mouse.mode.main = mainMouseModes.valueEdit;
        this.keyboard.inputs.marking.editedPlace = p;
        const inputMarking = this.keyboard.inputs.marking.selectors;
        inputMarking.foreign.attr("visibility", "visible");
        inputMarking.foreign.attr("x", p.position.x - 20);
        inputMarking.foreign.attr("y", p.position.y - 10);
        inputMarking.input.node().value = p.marking || null;
        inputMarking.input.node().focus();
    }
    /**
     * end editing place marking and close window
     * @param save changes propagate to net ?
     */
    EndInputMarking(save = true) {
        //todo: misto max hodnoty 999 bude uložená v settings a bude možnost zobrazovat hodnoty place pomocí seznamu a v place bude
        //      zobrazený pouze zástupný znak a hodnota bude v seznamu
        //todo: validace -> pokud neprojde a číslo bude třeba větší než 999 tak nepustí dál a zčervená input
        const inputMarking = this.keyboard.inputs.marking.selectors;
        inputMarking.foreign.attr("visibility", "hidden");
        inputMarking.foreign.attr("x", null);
        inputMarking.foreign.attr("y", null);
        if (save) {
            let val = +inputMarking.input.node().value;
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
    mainMouseModes["valueEdit"] = "value-edit";
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