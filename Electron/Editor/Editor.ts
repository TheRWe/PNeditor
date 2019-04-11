import * as d3 from 'd3';
import { PNet, Place, Transition, Position, Arc } from './PNet';
import { Key } from 'ts-keycode-enum';
import { rgb } from 'd3';
import { typedNull } from '../Helpers/purify';
import * as file from 'fs';
import { EditorMode, editorMode } from './EditorMode';
import { html, d3BaseSelector } from './Constants';
import { DrawModel } from './Draw';
import { TabControl } from './Tab';
import { Toggle, ToggleState } from './../Helpers/Toggle';

type FilePath = string | number | Buffer | URL;

function notImplemented() { throw Error("not implemented"); }

// todo: definice rozdělit do souborů (class extend/ definice metod bokem pomocí (this: cls))
export class PNEditor {

    private tabs: TabControl<{ net: PNet, file: string | null, selected: { places: Place[], tranisitons: Transition[] } }>;

    private toggles = { run: typedNull<Toggle>() };

    private draw = new DrawModel();


    private get net(): PNet | null {
        const currentTab = this.tabs.CurrentTab;
        return currentTab == null ? null : currentTab.net;
    }

    //#region File

    // todo: implicitní verzování ?

    /** Saves current net to given path */
    public Save(path: FilePath): boolean {
        const stringJSON = this.net.toJSON();
        console.debug(stringJSON);
        try {
            file.writeFileSync(path, JSON.stringify(stringJSON, null, 2), { encoding: "utf8" });
        } catch (ex) {
            console.error(ex)
            return false;
        }
        console.log("%c net SAVED", "color: rgb(0, 0, 255)");
        return true;
    }

    /** load net from given path */
    public Load(path: string): boolean {
        let objString: string;
        try {
            objString = file.readFileSync(path, { encoding: "utf8" });
            const jsonNet = JSON.parse(objString);
            const net = (new PNet()).fromJSON(jsonNet);

            this.tabs.AddTab({ net: net, file: path, selected: null }, "todo path");
            //this.net = net;

            console.log("%c LOADED net", "color: rgb(0, 0, 255)");
            console.log(this.net);
            this.draw.update();
        } catch (ex) {
            console.error(ex)
            return false;
        }

        return true;
    }

    // todo: záložky ?
    public NewNet() {
        this.tabs.AddTab({ net: new PNet(), file: null, selected: null });
        this.draw.update();
    }

    //#endregion


    //#region HTML

    /** helper for manipulating with html nodes*/
    private readonly html = {
        /** D3 selectors for elements */
        selectors: {
            /** main div element */
            div: typedNull<d3BaseSelector>(),
            /** tabs div element */
            tabs: typedNull<d3BaseSelector>(),
            /** svg PN view */
            svg: typedNull<d3BaseSelector>(),
            /** control buttons - holders */
            controlBar: {
                mouseDebugState: typedNull<d3BaseSelector>(),
                div: typedNull<d3BaseSelector>(),
            },
            helpers: {
                arcDragLine: typedNull<d3BaseSelector>(),
                selectDragRect: typedNull<d3BaseSelector>(),
            },
            net: {
                /*
                places: () => d3.select("#" + html.id.g.places).selectAll("g").data((this.net || { places: [] as Place[] }).places),
                transitions: () => d3.select("#" + html.id.g.transitions).selectAll("g").data((this.net || { transitions: [] as Transition[] }).transitions),
                arcs: () =>
                    d3.select("#" + html.id.g.arcs).selectAll("g")
                        .data((this.net || { arcs: [] as Arc[] }).arcs.map(x => { return { arc: x, line: GetArcEndpoints(this.net, x) }; }))
                */
            }
        },
        /** names of html entities */
    }

    //#endregion


    //#region Mode

    private mode: EditorMode = new EditorMode();

    // used to cancel all undone actions
    public resetState() {
        // todo: toggles.run ? 
        if (this.mode.selected === this.mode.default)
            return;

        switch (this.mode.selected) {
            case editorMode.arcMake:
                this.mouseEndArc();
                break;
            case editorMode.valueEdit:
                this.EndInputArc(false);
                this.EndInputMarking(false);
                break;
            // todo: implement state reset
            default:
                console.warn("implement");
                break;
        }
        if (this.toggles.run.State == ToggleState.on)
            this.mode.selected = editorMode.run;
    }

    //#endregion


    //#region Mouse

    /** initialize keyboard *on* handlers related to mouse */
    private InitMouseEvents() {
        this.html.selectors.svg.on("click", this.mouse.svg.onClick);
        const inputMarking = this.keyboard.inputs.marking.selectors;
        inputMarking.input
            .on("click", () => { d3.event.stopPropagation(); });
        inputMarking.buttonOK
            .on("click", () => { this.EndInputMarking(true); this.draw.update(); d3.event.stopPropagation(); });

        const arcValueMarking = this.keyboard.inputs.arcValue.selectors;
        arcValueMarking.input
            .on("click", () => { d3.event.stopPropagation(); });
        arcValueMarking.buttonOK
            .on("click", () => { this.EndInputArc(true); this.draw.update(); d3.event.stopPropagation(); });
    }

    /** mouse properties */
    private readonly mouse = {
        //todo: oddělat new_
        svg: {
            onClick: () => {
                console.debug("svg clicked");
                const mouse = this.mouse;
                switch (this.mode.selected) {
                    case editorMode.default:
                        this.net.AddTransition(mouse.svg.getMousePosition());
                        this.draw.update();
                        break;
                    case editorMode.arcMake:
                        this.mouseEndArc("new");
                        this.draw.update();
                        break;
                    case editorMode.valueEdit:
                        //todo: bude uloženo v settings jestli má dojít k uložení nebo resetu
                        //this.EndInputMarking();
                        //this.EndInputArc();
                        this.resetState();
                        break;
                    case editorMode.multiSelect:
                        const selected = this.tabs.CurrentTab.selected;
                        const netSelectors = this.html.selectors.net;
                        const selectedClassName = html.classes.multiSelection.selected;
                        // todo: zaobalení
                        selected.places = [];
                        selected.tranisitons = [];



                        this.mode.selected = editorMode.default;

                        break;
                    default:
                        notImplemented();
                }
            },
            onDragMultiSelect: (() => {
                //todo: globální dragdistance -> do configu
                const distance = 8;
                const helpers = this.html.selectors.helpers;
                const netSelectors = this.html.selectors.net;

                var selectionStart: Position = null;

                const isSelected = (pos1: Position, pos2: Position, elmPos: Position) => {
                    return ((elmPos.x < pos1.x && elmPos.x > pos2.x) || (elmPos.x > pos1.x && elmPos.x < pos2.x))
                        && ((elmPos.y < pos1.y && elmPos.y > pos2.y) || (elmPos.y > pos1.y && elmPos.y < pos2.y))
                }

                return d3.drag()
                    .clickDistance(distance)
                    .on("start", () => {
                        const currentTab = this.tabs.CurrentTab;
                        currentTab.selected = currentTab.selected || { places: [], tranisitons: [] };


                        //todo d3.event jako onDragPositionMove
                        const pos = this.mouse.svg.getMousePosition();

                        console.debug({ startdrag: this.html.selectors.svg });
                        selectionStart = this.mouse.svg.getMousePosition();

                        helpers.selectDragRect
                            .style("display", "inline")
                            .attr("x", pos.x)
                            .attr("y", pos.y)
                    })
                    .on("drag", () => {
                        const pos = this.mouse.svg.getMousePosition();

                        switch (this.mode.selected) {
                            case editorMode.default:
                            case editorMode.multiSelect:
                                const dx = pos.x - selectionStart.x;
                                if (dx > 0)
                                    helpers.selectDragRect
                                        .attr("width", dx)
                                        .attr("x", selectionStart.x)
                                else
                                    helpers.selectDragRect
                                        .attr("width", -dx)
                                        .attr("x", pos.x)

                                const dy = pos.y - selectionStart.y;
                                if (dy > 0)
                                    helpers.selectDragRect
                                        .attr("height", dy)
                                        .attr("y", selectionStart.y)
                                else
                                    helpers.selectDragRect
                                        .attr("height", -dy)
                                        .attr("y", pos.y)



                                //d.position.x = evPos.x;
                                //d.position.y = evPos.y;
                                //this.draw.update();
                                break;
                            default:
                                notImplemented();
                        }
                    })
                    .on("end", () => {
                        const pos = this.mouse.svg.getMousePosition();

                        helpers.selectDragRect
                            .style("display", "none")
                            .attr("x", 0)
                            .attr("y", 0)
                            .attr("width", 0)
                            .attr("height", 0)

                        const places = this.net.places.filter(elm => isSelected(selectionStart, pos, elm.position))
                        const transitions = this.net.transitions.filter(elm => isSelected(selectionStart, pos, elm.position))

                        const tabSelected = this.tabs.CurrentTab.selected;

                        tabSelected.places = places;
                        tabSelected.tranisitons = transitions;

                        console.debug({ endDrag: [...places, ...transitions] });

                        if (places.length + transitions.length > 0) {
                            this.mode.selected = editorMode.multiSelect;
                        }

                        //const dx = d.position.x - selectionStart.x;
                        //const dy = d.position.y - selectionStart.y;

                        //if (dx * dx + dy * dy > distance * distance) {
                        //    console.debug("enddrag");
                        //    this.net.AddHist();
                        //} else {
                        //    console.debug("canceldrag");
                        //    //d.position.x = selectionStart.x;
                        //    //d.position.y = selectionStart.y;
                        //    this.draw.update();
                        //}
                        //selectionStart = null;
                    })
            })(),
            /** returns PNet Position relative to main svg element */
            getMousePosition: (): Position => {
                const coords = d3.mouse(this.html.selectors.svg.node() as SVGSVGElement);
                return { x: coords[0], y: coords[1] };
            }
        },
        controlBar: {
            main: {
                runToggle: {
                    //todo: smazat - pouze příklad pro práci s checkboxem
                    onChange: (_: any, i: number, nodes: d3.BaseType[] | d3.ArrayLike<d3.BaseType>) => {
                        const elm = d3.select(nodes[i]);
                        const checked = (elm.property("checked") as boolean);
                        this.mouse.controlBar.main.runToggle.onCheckedChange(checked);
                    },

                    onCheckedChange: (checked: boolean) => {
                    }
                }
            }
        },
        transition: {
            onClick: (t: Transition) => {
                console.debug("transition clicked");
                const mouse = this.mouse;
                switch (this.mode.selected) {
                    case editorMode.default:
                        this.mouseStartArc(t);
                        d3.event.stopPropagation();
                        break;
                    case editorMode.arcMake:
                        this.mouseEndArc();
                        d3.event.stopPropagation();
                        break;
                    case editorMode.run:
                        if (this.net.RunTransition(t))
                            this.draw.update();
                        d3.event.stopPropagation();
                        break;
                    default:
                        notImplemented();
                }
            },
            onRightClick: (t: Transition) => {
                console.debug("transition right click");
                switch (this.mode.selected) {
                    default:
                        notImplemented();
                }
            },
            onWheel: (t: Transition) => {
                const e = d3.event;
                //console.debug("transition wheel");
                var deltaY = e.deltaY;
                switch (this.mode.selected) {
                    default:
                        notImplemented();
                }
            }
        },
        place: {
            onClick: (p: Place) => {
                console.debug("place click");
                switch (this.mode.selected) {
                    case editorMode.valueEdit:
                    case editorMode.default:
                        if (p.marking == null) p.marking = 0;

                        this.EndInputMarking();
                        this.EndInputArc();

                        this.StartInputMarking(p);
                        d3.event.stopPropagation();
                        break;
                    case editorMode.arcMake:
                        // todo: kontrola na to jeslti už na daný place existuje arc a pokud jo ... (todo: analýza chování)
                        this.mouseEndArc(p);

                        d3.event.stopPropagation();
                        this.draw.update();
                        break;
                    default:
                        notImplemented();
                }
            },
            onRightClick: (p: Place) => {
                console.debug("place right click");
                switch (this.mode.selected) {
                    default:
                        notImplemented();
                }
            },
            onWheel: (p: Place) => {
                const e = d3.event;
                console.debug("place wheel");
                var deltaY = e.deltaY;
                switch (this.mode.selected) {
                    case editorMode.default:
                        if (deltaY < 0) {
                            p.marking++;
                            this.net.AddHist();
                            this.draw.update();
                        } else if (p.marking > 0) {
                            p.marking--;
                            this.net.AddHist();
                            this.draw.update();
                        }

                        break;
                    default:
                        notImplemented();
                }
            }
        },
        arc: {
            onClickHitbox: (a: Arc) => {
                console.debug("arc clicked");

                const mouse = this.mouse;
                switch (this.mode.selected) {
                    case editorMode.valueEdit:
                    case editorMode.default:
                        this.EndInputMarking();
                        this.EndInputArc();

                        this.StartInputArc(a);
                        d3.event.stopPropagation();
                        break;
                    default:
                        notImplemented();
                }
            },
            onRightClick: (a: Arc) => {
                console.debug("arc right click");
                switch (this.mode.selected) {
                    default:
                        notImplemented();
                }
            },
            onWheel: (a: Arc) => {
                const e = d3.event;
                console.debug("arc wheel");
                var deltaY = e.deltaY;
                switch (this.mode.selected) {
                    case editorMode.default:
                        if (deltaY < 0) {
                            a.qty++;
                        } else {
                            a.qty--;
                        }

                        if (a.qty === 0) {
                            if (deltaY < 0) {
                                a.qty++;
                            } else {
                                a.qty--;
                            }
                        }
                        this.net.AddHist();
                        break;
                    default:
                        notImplemented();
                }
                this.draw.update();
            }
        },
        onDragPositionMove:
            (() => {
                const distance = 8;

                var posStart: Position = null;
                var objsPos: { obj: { position: Position }, defaultPos: Position }[] = [];

                return d3.drag()
                    .clickDistance(distance)
                    .on("start", (d: { position: Position }) => {
                        posStart = { ...d.position };

                        switch (this.mode.selected) {
                            case editorMode.multiSelect:
                                const selectedClassName = html.classes.multiSelection.selected;
                                /*
                                const objs: { position: Position }[] = [
                                    ...this.html.selectors.net.places()
                                        .filter(`.${selectedClassName}`)
                                        .data(),
                                    ...this.html.selectors.net.transitions()
                                        .filter(`.${selectedClassName}`)
                                        .data()
                                ]
                                objsPos = objs.map(obj => { return { obj, defaultPos: { ...obj.position } } });
                                */
                                break;

                            case editorMode.default:
                                break;

                            default:
                                notImplemented();
                        }
                        console.debug({ startdrag: d });
                    })
                    .on("drag", (d: { position: Position }) => {
                        const evPos = (d3.event as Position);

                        const dx = evPos.x - posStart.x;
                        const dy = evPos.y - posStart.y;

                        switch (this.mode.selected) {
                            case editorMode.default:
                                d.position.x = evPos.x;
                                d.position.y = evPos.y;
                                this.draw.update();
                                break;

                            case editorMode.multiSelect:
                                objsPos.forEach(({ obj, defaultPos: { x: defaultX, y: defaultY } }) => {
                                    obj.position.x = dx + defaultX;
                                    obj.position.y = dy + defaultY;
                                })
                                this.draw.update();
                                break;

                            default:
                                notImplemented();
                        }
                    })
                    .on("end", (d: { position: Position }) => {
                        const evPos = (d3.event as Position);

                        const dx = evPos.x - posStart.x;
                        const dy = evPos.y - posStart.y;
                        var successfull = false;
                        successfull = (dx * dx + dy * dy > distance * distance);

                        switch (this.mode.selected) {
                            case editorMode.default:
                            case editorMode.multiSelect:

                                if (successfull) {
                                    console.debug("enddrag");
                                    this.net.AddHist();
                                } else {
                                    console.debug("canceldrag");
                                    d.position.x = posStart.x;
                                    d.position.y = posStart.y;
                                    this.draw.update();
                                }
                                posStart = null;

                                if (!successfull) {
                                    objsPos.forEach(({ obj, defaultPos: { x: defaultX, y: defaultY } }) => {
                                        obj.position.x = defaultX;
                                        obj.position.y = defaultY;
                                    });
                                    this.draw.update();
                                }
                                objsPos = [];
                                break;

                            default:
                                notImplemented();
                        }

                        
                    })
            })(),
        helpers: {
            arcMakeHolder: typedNull<Place | Transition>()
        }
    }

    /**
     * start arc from given transition or place
     * @param tp transition or place
     */
    private mouseStartArc(tp: Transition | Place) {
        this.mode.selected = editorMode.arcMake;
        this.mouse.helpers.arcMakeHolder = tp;

        const arcDragLine = this.html.selectors.helpers.arcDragLine;
        const getMousePosition = this.mouse.svg.getMousePosition;

        const mousePos = getMousePosition();

        arcDragLine
            .style("display", null)
            .attr("x1", tp.position.x)
            .attr("y1", tp.position.y)
            .attr("x2", mousePos.x)
            .attr("y2", mousePos.y);

        //todo metody start drag, stop drag
        this.html.selectors.svg.on("mousemove", e => {
            const mousePos = getMousePosition();
            arcDragLine
                .attr("x2", mousePos.x)
                .attr("y2", mousePos.y);
        })

    }

    // todo: vracet propojitelnost se zadaným objektem ?
    /**
     * end creating arc with given ending
     *  null -> no changes
     *  Transition | Place -> connect to place
     *  "new" -> creates new Place | Transition to connect
     */
    private mouseEndArc(ending: null | Transition | Place | "new" = null) {
        this.mode.swap();

        const arcDragLine = this.html.selectors.helpers.arcDragLine;

        //todo: nebezpečné, vymyslet alternativu
        this.html.selectors.svg.on("mousemove", null);

        arcDragLine
            .style("display", "none")
            .attr("x1", null)
            .attr("y1", null)
            .attr("x2", null)
            .attr("y2", null);

        if (ending == null)
            return;

        if (ending === "new") {
            if (this.mouse.helpers.arcMakeHolder instanceof Transition) {
                const addedPlace = this.net.AddPlace(this.mouse.svg.getMousePosition());
                this.net.AddArc(this.mouse.helpers.arcMakeHolder as Transition, addedPlace, 1);
            } else if (this.mouse.helpers.arcMakeHolder instanceof Place) {
                //todo place making
                console.error("make transition");
            }
        } else if (ending instanceof Place) {
            if (this.mouse.helpers.arcMakeHolder instanceof Transition) {
                console.debug("connecting place")
                this.net.AddArc(this.mouse.helpers.arcMakeHolder as Transition, ending, 1);
            } else {
                //todo: hlaška nebo vyrvoření place mezi dvěma transitions
                console.error("can't connect two transitions");
            }
        } else {
            //todo: propojování
            console.error("connect");
        }

        this.mouse.helpers.arcMakeHolder = null;
    }

    //#endregion Mouse


    //#region Keyboard

    /** initialize keyboard *on* handlers related to keyboard */
    private InitKeyboardEvents() {
        this.keyboard.inputs.marking.selectors.input
            .on("keypress", this.keyboard.inputs.marking.onKeyPress);
        this.keyboard.inputs.arcValue.selectors.input
            .on("keypress", this.keyboard.inputs.arcValue.onKeyPress);
    }

    /** keyboard properties */
    private readonly keyboard = {
        /** input element props */
        inputs: {
            marking: {
                /** curently edited place with marking edit input */
                editedPlace: typedNull<Place>(),
                onKeyPress: () => {
                    if (d3.event.keyCode == Key.Enter) {
                        this.EndInputMarking(true);
                        this.draw.update();
                    }

                    d3.event.stopPropagation();
                },
                /** marking editor input */
                selectors: {
                    foreign: typedNull<d3.Selection<d3.BaseType, {}, d3.BaseType, any>>(),
                    input: typedNull<d3.Selection<d3.BaseType, {}, d3.BaseType, any>>(),
                    buttonOK: typedNull<d3.Selection<d3.BaseType, {}, d3.BaseType, any>>()
                },
            },
            arcValue: {
                /** curently edited arc with value edit input */
                editedArc: typedNull<Arc>(),
                onKeyPress: () => {
                    if (d3.event.keyCode == Key.Enter) {
                        this.EndInputArc(true);
                        this.draw.update();
                    }

                    d3.event.stopPropagation();
                },
                /** marking editor input */
                selectors: {
                    foreign: typedNull<d3.Selection<d3.BaseType, {}, d3.BaseType, any>>(),
                    input: typedNull<d3.Selection<d3.BaseType, {}, d3.BaseType, any>>(),
                    buttonOK: typedNull<d3.Selection<d3.BaseType, {}, d3.BaseType, any>>()
                },
            }
        }
    }

    public Undo() {
        this.net.Undo();
        this.draw.update();
    }

    public Redo() {
        this.net.Redo();
        this.draw.update();
    }

    /** open marking edit window for given place*/
    private StartInputArc(a: Arc) {
        if (this.mode.selected !== editorMode.valueEdit)
            this.mode.selected = editorMode.valueEdit;

        this.keyboard.inputs.arcValue.editedArc = a;
        const inputArc = this.keyboard.inputs.arcValue.selectors;
        inputArc.foreign.style("display", null);
        const mousePos = this.mouse.svg.getMousePosition();
        inputArc.foreign.attr("x", mousePos.x - 20);
        inputArc.foreign.attr("y", mousePos.y - 10);

        (inputArc.input.node() as any).value = a.qty;
        (inputArc.input.node() as any).focus();
    }

    /**
     * end editing arc value and close window
     * @param save changes propagate to net ?
     */
    private EndInputArc(save: boolean = false) {
        if (this.mode.selected === editorMode.valueEdit)
            this.mode.swap();
        else
            return;

        //todo: misto max hodnoty 999 bude uložená v settings a bude možnost zobrazovat hodnoty place pomocí seznamu a v place bude
        //      zobrazený pouze zástupný znak a hodnota bude v seznamu
        //todo: validace -> pokud neprojde a číslo bude třeba větší než 999 tak nepustí dál a zčervená input
        const inputArc = this.keyboard.inputs.arcValue.selectors;
        inputArc.foreign.style("display", "none");
        inputArc.foreign.attr("x", null);
        inputArc.foreign.attr("y", null);

        if (save) {
            let val = +(inputArc.input.node() as any).value;
            this.keyboard.inputs.arcValue.editedArc.qty = val;
            this.net.AddHist();
        }

        this.keyboard.inputs.marking.editedPlace = null;
    }

    /** open marking edit window for given place*/
    private StartInputMarking(p: Place) {
        if (this.mode.selected !== editorMode.valueEdit)
            this.mode.selected = editorMode.valueEdit;

        this.keyboard.inputs.marking.editedPlace = p;
        const inputMarking = this.keyboard.inputs.marking.selectors;
        inputMarking.foreign.style("display", null);
        inputMarking.foreign.attr("x", p.position.x - 20);
        inputMarking.foreign.attr("y", p.position.y - 10);

        (inputMarking.input.node() as any).value = p.marking || null;
        (inputMarking.input.node() as any).focus();
    }

    /**
     * end editing place marking and close window
     * @param save changes propagate to net ?
     */
    private EndInputMarking(save: boolean = false) {
        if (this.mode.selected === editorMode.valueEdit)
            this.mode.swap();
        else
            return;

        // todo: misto max hodnoty 999 bude uložená v settings a bude možnost zobrazovat hodnoty place pomocí seznamu a v place bude
        //       zobrazený pouze zástupný znak a hodnota bude v seznamu
        // todo: validace -> pokud neprojde a číslo bude třeba větší než 999 tak nepustí dál a zčervená input
        const inputMarking = this.keyboard.inputs.marking.selectors;

        inputMarking.foreign.style("display", "none");
        inputMarking.foreign.attr("x", null);
        inputMarking.foreign.attr("y", null);

        if (save) {
            let val = +(inputMarking.input.node() as any).value;
            this.keyboard.inputs.marking.editedPlace.marking = val;
            this.net.AddHist();
        }

        this.keyboard.inputs.marking.editedPlace = null;
    }

    //#endregion


    //#region Constructor

    //todo force for nearby objects(disablable in settings)
    constructor(divElement: d3BaseSelector, loadPath: string = null) {
        const selectors = this.html.selectors;

        selectors.div = divElement;


        //#region Controlbar

        const controlbarBase = selectors.controlBar.div =
            divElement.append("div")
                .style("height", "30px")
                .style("background", rgb(223, 223, 223).hex());

        selectors.controlBar.mouseDebugState =
            controlbarBase
                .append("div")
                .style("display", "inline-block")
                .style("width", "80px")
                .style("text-align", "center")
                .style("user-select", "none")
                .text("default");

        const runtgl = this.toggles.run = new Toggle(selectors.controlBar.div, "Run");
        runtgl.AddOnToggleChange((tlg) => {
            const state = tlg.State;
            if (state === ToggleState.on) {
                this.resetState();
                // todo: ipmlementované v reset state a bude volat jen to
                this.mode.selected = editorMode.run;
            } else {
                this.resetState();
                this.mode.selected = editorMode.default;
            }
        });

        //#endregion

        const tabs = this.tabs = new TabControl(divElement.append("div"));
        tabs.AddOnSelectionChanged(() => {
            this.draw.data = this.tabs.CurrentTab;
            this.draw.update();
        })
        tabs.AddOnTabAddButton(() => { this.NewNet(); })

        //#region Initialize SVG-HTML

        const svg = selectors.svg = divElement
            .append("svg")
            .attr("width", "100%")
            .attr("height", 600);


        const defs = svg.append('svg:defs');
        const defsNames = html.classes.defs;

        const G = svg.append("g");

        G.append("g").attr("id", html.id.g.arcs);
        G.append("g").attr("id", html.id.g.places);
        G.append("g").attr("id", html.id.g.transitions);
        selectors.helpers.arcDragLine = G.append("line");


        let markingForeign = G.append("foreignObject")
            .style("display", "none").attr("width", "100%");
        const markingDiv = markingForeign.append("xhtml:div").style("height", "50");

        const inputMarkingSelectors = this.keyboard.inputs.marking.selectors;
        inputMarkingSelectors.input = markingDiv.append("xhtml:input");
        inputMarkingSelectors.buttonOK = markingDiv.append("xhtml:input").attr("type", "button").attr("value", "OK").style("width", "35px");
        inputMarkingSelectors.foreign = markingForeign;

        inputMarkingSelectors.input
            .attr("type", "number")
            .attr("min", 0)
            .attr("max", 999)
            .style("width", "40px")
            .style("height", "15px")



        let arcValueForeign = G.append("foreignObject")
            .style("display", "none").attr("width", "100%");
        const arcValueDiv = arcValueForeign.append("xhtml:div").style("height", "50");

        const inputArcValue = this.keyboard.inputs.arcValue.selectors;
        inputArcValue.input = arcValueDiv.append("xhtml:input");
        inputArcValue.buttonOK = arcValueDiv.append("xhtml:input").attr("type", "button").attr("value", "OK").style("width", "35px");
        inputArcValue.foreign = arcValueForeign;

        inputArcValue.input
            .attr("type", "number")
            .attr("min", -999)
            .attr("max", 999)
            .style("width", "45px")
            .style("height", "15px")


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

        selectors.helpers.arcDragLine
            .style("stroke", "black")
            .style("stroke-width", 1.5)
            .style("display", "none")
            .style("pointer-events", "none");

        selectors.helpers.selectDragRect = G.append("rect")
            .attr("width", 0)
            .attr("height", 0)
            .attr("x", 0)
            .attr("y", 0)
            .style("display", "none")
            .style("stroke-width", 2)
            .style("stroke", "black")
            .style("stroke-dasharray", 15)
            .style("stroke-opacity", 0.5)
            .style("stroke-linecap", "round")
            .style("fill", "none");

        (svg as any).call(this.mouse.svg.onDragMultiSelect);

        //#endregion

        this.InitMouseEvents();
        this.InitKeyboardEvents();


        // todo: load all nets
        if (!(loadPath && this.Load(loadPath))) {
            this.NewNet();
        }

        console.debug(this);
        this.draw.update();
    }

    //#endregion

}


