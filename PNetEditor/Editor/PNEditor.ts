import { Tab } from "../CORE/TabControl/Tab";
import { d3BaseSelector } from "../Editor/Constants";
import { PNModel, Place, Arc, Transition } from "./Models/PNet/PNModel";
import { PNDraw } from "./Models/PNet/PNDraw";
import { PNAction } from "./Models/PNet/PNAction";
import { CallbackType } from "./Models/_Basic/DrawBase";
import * as d3 from 'd3';
import { Position } from './Constants';
import { notImplemented, typedNull } from "../Helpers/purify";
import { Key } from "ts-keycode-enum";
import { ToggleState } from "../Helpers/Toggle";


export class PNEditor {
    public readonly tab: Tab;
    public readonly svg: d3BaseSelector

    public readonly pnModel: PNModel;
    public readonly pnDraw: PNDraw;
    public readonly pnAction: PNAction;

    //#region Mode

    private mode: EditorMode = new EditorMode();

    // used to cancel all undone actions
    private resetState() {
        // todo: Draw IsSelectionEnabled
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
        //if (this.toggles.run.State == ToggleState.on)
        //    this.mode.selected = editorMode.run;
    }

    //#endregion


    //#region Inputs

    InitInputEvenents() {
        const inputMarking = this.keyboard.inputs.marking.selectors;
        inputMarking.input
            .on("click", () => { d3.event.stopPropagation(); });
        inputMarking.buttonOK
            .on("click", () => { this.EndInputMarking(true); this.pnDraw.update(); d3.event.stopPropagation(); });

        const arcValueMarking = this.keyboard.inputs.arcValue.selectors;
        arcValueMarking.input
            .on("click", () => { d3.event.stopPropagation(); });
        arcValueMarking.buttonOK
            .on("click", () => { this.EndInputArc(true); this.pnDraw.update(); d3.event.stopPropagation(); });
    }

	//#endregion


    //#region Mouse

    /** initialize keyboard *on* handlers related to mouse */
    private InitMouseEvents() {
        const callbacks = this.pnDraw.Callbacks;
        callbacks.place.AddCallback(CallbackType.letfClick, this.mouse.place.onClick);
        callbacks.place.AddCallback(CallbackType.rightClick, this.mouse.place.onRightClick);
        callbacks.place.AddCallback(CallbackType.wheel, this.mouse.place.onWheel);

        callbacks.place.AddCallback(CallbackType.dragStart, this.mouse.onDragPositionMove.start);
        callbacks.place.AddCallback(CallbackType.drag, this.mouse.onDragPositionMove.drag);
        callbacks.place.AddCallback(CallbackType.dragEnd, this.mouse.onDragPositionMove.end);
        callbacks.place.AddCallback(CallbackType.dragRevert, this.mouse.onDragPositionMove.revert);

        callbacks.transition.AddCallback(CallbackType.letfClick, this.mouse.transition.onClick);
        callbacks.transition.AddCallback(CallbackType.rightClick, this.mouse.transition.onRightClick);
        callbacks.transition.AddCallback(CallbackType.wheel, this.mouse.transition.onWheel);

        callbacks.transition.AddCallback(CallbackType.dragStart, this.mouse.onDragPositionMove.start);
        callbacks.transition.AddCallback(CallbackType.drag, this.mouse.onDragPositionMove.drag);
        callbacks.transition.AddCallback(CallbackType.dragEnd, this.mouse.onDragPositionMove.end);
        callbacks.transition.AddCallback(CallbackType.dragRevert, this.mouse.onDragPositionMove.revert);

        callbacks.container.AddCallback(CallbackType.letfClick, this.mouse.svg.onClick);
        callbacks.container.AddCallback(CallbackType.rightClick, this.mouse.svg.onRightClick);
        callbacks.container.AddCallback(CallbackType.wheel, this.mouse.svg.onWheel);
    }

    /** mouse properties */
    private readonly mouse = {
        //todo: oddělat new_
        svg: {
            //todo: redundantní kód s gePos na draw
            getMousePosition: (): Position => {
                const svg = this.svg;
                const coords = d3.mouse(svg.node() as SVGSVGElement);
                const pos = { x: coords[0], y: coords[1] };
                return pos;
            },

            onClick: (_: null, pos: Position) => {
                console.debug("svg clicked");
                const mouse = this.mouse;
                switch (this.mode.selected) {
                    case editorMode.default:
                        this.pnAction.AddTransition(pos);
                        this.pnDraw.update();
                        break;
                    case editorMode.arcMake:
                        this.mouseEndArc("new");
                        this.pnDraw.update();
                        break;
                    case editorMode.valueEdit:
                        //todo: bude uloženo v settings jestli má dojít k uložení nebo resetu
                        //this.EndInputMarking();
                        //this.EndInputArc();
                        this.resetState();
                        break;
                    default:
                        notImplemented();
                }
            },
            onRightClick: () => { },
            onWheel: () => { },
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
                        if (this.pnAction.RunTransition(t))
                            this.pnDraw.update();
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
            onClick: (p: Place, pos: Position) => {
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
                        this.pnDraw.update();
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
                            this.pnAction.AddHist();
                            this.pnDraw.update();
                        } else if (p.marking > 0) {
                            p.marking--;
                            this.pnAction.AddHist();
                            this.pnDraw.update();
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
                        this.pnAction.AddHist();
                        break;
                    default:
                        notImplemented();
                }
                this.pnDraw.update();
            }
        },
        onDragPositionMove: {
            start: (d: { position: Position }) => {
                switch (this.mode.selected) {
                    case editorMode.default:
                        break;

                    default:
                        notImplemented();
                }
                console.debug({ startdrag: d });
            },
            drag: (d: { position: Position }, evPos: Position, posStart: Position) => {
                switch (this.mode.selected) {
                    case editorMode.default:
                        d.position.x = evPos.x;
                        d.position.y = evPos.y;
                        this.pnDraw.update();
                        break;

                    default:
                        notImplemented();
                }
            },
            end: (d: { position: Position }, evPos: Position, posStart: Position) => {
                switch (this.mode.selected) {
                    case editorMode.default:
                        this.pnAction.AddHist();

                        //objsPos = [];
                        break;

                    default:
                        notImplemented();
                }
            },
            revert: (d: { position: Position }, evPos: Position, posStart: Position) => {
                switch (this.mode.selected) {
                    case editorMode.default:
                        d.position.x = posStart.x;
                        d.position.y = posStart.y;
                        this.pnDraw.update();
                        break;
                    default:
                        notImplemented();
                }
            },
        },
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

        this.pnDraw.ShowArcDragLine(tp.position);
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

        this.pnDraw.ShowArcDragLine(null);

        if (ending == null)
            return;

        if (ending === "new") {
            if (this.mouse.helpers.arcMakeHolder instanceof Transition) {
                const addedPlace = this.pnAction.AddPlace(this.mouse.svg.getMousePosition());
                this.pnAction.AddArc(this.mouse.helpers.arcMakeHolder as Transition, addedPlace, 1);
            } else if (this.mouse.helpers.arcMakeHolder instanceof Place) {
                //todo place making
                console.error("make transition");
            }
        } else if (ending instanceof Place) {
            if (this.mouse.helpers.arcMakeHolder instanceof Transition) {
                console.debug("connecting place")
                this.pnAction.AddArc(this.mouse.helpers.arcMakeHolder as Transition, ending, 1);
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
                        this.pnDraw.update();
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
                        this.pnDraw.update();
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
            this.pnAction.AddHist();
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
            this.pnAction.AddHist();
        }

        this.keyboard.inputs.marking.editedPlace = null;
    }

    //#endregion


    constructor(tab: Tab, pnmodel: PNModel) {
        this.tab = tab;

        this.svg = tab.container.append("svg");
        this.pnModel = pnmodel;

        this.pnAction = new PNAction(pnmodel);

        this.pnDraw = new PNDraw(this.svg);
        this.pnDraw.data = pnmodel;
        this.pnDraw.update();


        this.InitMouseEvents();
    }
}





export class EditorMode {
    public readonly default: editorMode = editorMode.default;
    private _last: editorMode = editorMode.default;
    private _selected: editorMode = editorMode.default;

    public get selected(): editorMode { return this._selected; }
    public set selected(v: editorMode) {
        const changed = v !== this._selected;
        this._last = this._selected;
        this._selected = v;
        if (changed)
            this.onChanged();
    }

    private onChanged = () => { };

    public AddOnChange(callback: () => void) {
        const onChanged = this.onChanged;

        this.onChanged = () => {
            onChanged();
            callback();
        }
    }

    public get last(): editorMode { return this._last; }
    public swap(): void { this.selected = this.last; }
}

export enum editorMode {
    default = "default",
    arcMake = "arc-make",
    valueEdit = "edit",
    run = "run",
}
