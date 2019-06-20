import { Tab } from "../CORE/TabControl/Tab";
import { d3BaseSelector } from "../Editor/Constants";
import { PNModel, Place, Arc, Transition } from "./Models/PNet/PNModel";
import { PNDraw, arcWithLine } from "./Models/PNet/PNDraw";
import { PNAction } from "./Models/PNet/PNAction";
import { CallbackType, ForceNode } from "./Models/_Basic/DrawBase";
import * as d3 from 'd3';
import { Position } from './Constants';
import { notImplemented, typedNull } from "../Helpers/purify";
import { PNDrawControls } from "./Models/PNet/Helpers/PNDrawControls";
import { PNAnalysisDraw } from "./Models/PNAnalysis/PNAnalysisDraw";
import { groupmap, TabInterface } from "../CORE/MainWindow";
import { ToggleSwitch, ToggleSwitchState } from "../CORE/ToggleSwitch";
import { PNDrawInputs } from "./Models/PNet/Helpers/PNDrawInputs";
import { PNAnalysis } from "./Models/PNAnalysis/PNAnalysis";


export class PNEditor implements TabInterface {

    public readonly tab: Tab;
    public readonly svg: d3BaseSelector

    public readonly pnModel: PNModel;
    public readonly pnDraw: PNDraw;
    public readonly pnAction: PNAction;

    public readonly inputs: PNDrawInputs;
    private readonly controls: PNDrawControls;

    private _analysis: PNAnalysis = null;
    public RunAnalysis() {
        if (this._analysis == null) {
            this._analysis = new PNAnalysis(this.tab, this.pnModel);
        }
        this.pnAction.AddOnModelChange(() => {
            this._analysis.update();
        });

    }

    public IsSaveable(): boolean {
        return true;
    }

    GetStringToSave(): string {
        return JSON.stringify(this.pnModel.toJSON(), null, 2);
    }


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
                this.inputs.HideAllInputs();
                this.keyboard.inputs.arcValue.editedArc = null;
                this.keyboard.inputs.marking.editedPlace = null;
                break;
            // todo: implement state reset
            default:
                console.warn("implement");
                break;
        }

        this.mode.selected = editorMode.default;
        this.controls.toggleSwitchRunEdit.StateSuppressed = ToggleSwitchState.off;
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

        callbacks.arc.AddCallback(CallbackType.letfClick, this.mouse.arc.onClick);
        callbacks.arc.AddCallback(CallbackType.rightClick, this.mouse.arc.onRightClick);
        callbacks.arc.AddCallback(CallbackType.wheel, this.mouse.arc.onWheel);

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
                        console.debug("resetstate");
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
                    case editorMode.default:
                        this.pnAction.RemoveTransition(t);
                        this.pnDraw.update();
                        break;
                    default:
                        notImplemented();
                }
            },
            onWheel: (t: Transition) => {
                const e = d3.event;
                //console.debug("transition wheel");
                var deltaY = e.deltaY;
                switch (this.mode.selected) {
                    case editorMode.default:
                        t.isCold = !t.isCold;
                        this.pnAction.CallOnModelChange();
                        this.pnDraw.update();
                        break;
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
                    case editorMode.default:
                        this.pnAction.RemovePlace(p);
                        this.pnDraw.update();
                        break;
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
                            this.pnAction.CallOnModelChange();
                            this.pnDraw.update();
                        } else if (p.marking > 0) {
                            p.marking--;
                            this.pnAction.CallOnModelChange();
                            this.pnDraw.update();
                        }

                        break;
                    default:
                        notImplemented();
                }
            }
        },
        arc: {
            // todo: bude jen arc a ne arcWithLine
            onClick: (a: arcWithLine) => {
                console.debug("arc clicked");

                const mouse = this.mouse;
                switch (this.mode.selected) {
                    case editorMode.valueEdit:
                    case editorMode.default:
                        this.StartInputArc(a.arc);
                        d3.event.stopPropagation();
                        break;
                    default:
                        notImplemented();
                }
            },
            onRightClick: (a: arcWithLine) => {
                console.debug("arc right click");
                switch (this.mode.selected) {
                    case editorMode.default:
                        this.pnAction.RemoveArc(a.arc);
                        this.pnDraw.update();
                        break;
                    default:
                        notImplemented();
                }
            },
            onWheel: (a: arcWithLine) => {
                const e = d3.event;
                // todo: arc wheel
                console.debug("arc wheel");
                var deltaY = e.deltaY;
                switch (this.mode.selected) {
                    case editorMode.default:
                        const toPlace = a.arc.toPlace;
                        a.arc.toPlace = a.arc.toTransition;
                        a.arc.toTransition = toPlace;

                        this.pnAction.CallOnModelChange();
                        this.pnDraw.update();
                        break;
                    default:
                        notImplemented();
                }
                this.pnDraw.update();
            }
        },
        onDragPositionMove: {
            start: (d: ForceNode, evPos: Position) => {
                switch (this.mode.selected) {
                    case editorMode.default:
                        this.pnDraw.simulation.alpha(0.7).restart();
                        d.fx = evPos.x;
                        d.fy = evPos.y;
                        break;

                    default:
                        notImplemented();
                }
                console.debug({ startdrag: d });
            },
            drag: (d: ForceNode, evPos: Position, posStart: Position) => {
                switch (this.mode.selected) {
                    case editorMode.default:
                        this.pnDraw.simulation.alpha(0.7);
                        d.fx = evPos.x;
                        d.fy = evPos.y;
                        this.pnDraw.update();
                        break;

                    default:
                        notImplemented();
                }
            },
            end: (d: Transition | Place, evPos: Position, posStart: Position) => {
                switch (this.mode.selected) {
                    case editorMode.default:
                        delete d.fx;
                        delete d.fy;
                        this.pnAction.AddHist();
                        this.pnDraw.simulation.alpha(0.7).restart();
                        this.pnDraw.update();

                        break;
                    default:
                        notImplemented();
                }
            },
            revert: (d: Transition | Place, evPos: Position, posStart: Position) => {
                switch (this.mode.selected) {
                    case editorMode.default:
                    case editorMode.valueEdit:
                        delete d.fx;
                        delete d.fy;
                        this.pnDraw.simulation.alpha(0.7).restart();
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

        this.pnDraw.ShowArcDragLine({ x: tp.x, y: tp.y });
    }

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
                this.pnAction.AddArc(this.mouse.helpers.arcMakeHolder as Transition, addedPlace, 1, null);
            } else if (this.mouse.helpers.arcMakeHolder instanceof Place) {
                //todo place making
                console.error("make transition");
            }
        } else if (ending instanceof Place) {
            if (this.mouse.helpers.arcMakeHolder instanceof Transition) {
                console.debug("connecting place")
                this.pnAction.AddArc(this.mouse.helpers.arcMakeHolder as Transition, ending, 1, null);
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
        const inputs = this.inputs;

        inputs.AddOnInputArc(this.keyboard.inputs.arcValue.onInputEnd);
        inputs.AddOnInputMarking(this.keyboard.inputs.marking.onInputEnd);
    }

    /** keyboard properties */
    private readonly keyboard = {
        /** input element props */
        inputs: {
            marking: {
                /** curently edited place with marking edit input */
                editedPlace: typedNull<Place>(),
                onInputEnd: (val: number | null) => {
                    if (val != null) {
                        this.keyboard.inputs.marking.editedPlace.marking = val;
                        this.pnAction.CallOnModelChange();
                        this.pnDraw.update();
                    }
                    this.keyboard.inputs.marking.editedPlace = null;
                    this.mode.swap();
                },
            },
            arcValue: {
                /** curently edited arc with value edit input */
                editedArc: typedNull<Arc>(),
                onInputEnd: (val: { toPlace: number, toTransition: number } | null) => {
                    if (val != null) {
                        this.keyboard.inputs.arcValue.editedArc.toPlace = val.toPlace;
                        this.keyboard.inputs.arcValue.editedArc.toTransition = val.toTransition;
                        this.pnAction.CallOnModelChange();
                        this.pnDraw.update();
                    }
                    this.keyboard.inputs.arcValue.editedArc = null;
                    this.mode.swap();
                },
            }
        }
    }


    /** open marking edit window for given place*/
    private StartInputArc(arc: Arc) {
        if (this.mode.selected !== editorMode.valueEdit)
            this.mode.selected = editorMode.valueEdit;

        this.keyboard.inputs.arcValue.editedArc = arc;
        this.inputs.ShowInputArc(this.mouse.svg.getMousePosition(), { toPlace: arc.toPlace, toTransition: arc.toTransition });
    }

    /** open marking edit window for given place*/
    private StartInputMarking(p: Place) {
        if (this.mode.selected !== editorMode.valueEdit)
            this.mode.selected = editorMode.valueEdit;

        this.keyboard.inputs.marking.editedPlace = p;
        this.inputs.ShowInputMarking(this.mouse.svg.getMousePosition(), p.marking);
    }

    //#endregion


    constructor(tab: Tab, pnmodel: PNModel) {
        this.tab = tab;

        tab.label = "Net";
        this.tab.container.style("height", "99vh")
            .style("display", "flex")
            .style("flex-direction", "column");
        const controlDiv = tab.container.append("div");
        const svg = this.svg = tab.container.append("svg");

        this.pnModel = pnmodel;

        this.pnAction = new PNAction(pnmodel);
        this.pnAction.AddHist();

        const controls = this.controls = new PNDrawControls(controlDiv, this);
        controls.toggleSwitchRunEdit.AddOnToggleChange(tgl => {
            this.resetState();
            switch (tgl.State) {
                case ToggleSwitchState.on:
                    this.mode.selected = editorMode.run;
                    break;
                default:
                    break;
            }
        });

        const pnDraw = this.pnDraw = new PNDraw(svg);
        pnDraw.data = pnmodel;
        pnDraw.update();

        this.inputs = new PNDrawInputs(pnDraw);

        this.InitMouseEvents();
        this.InitKeyboardEvents();

        groupmap.set(tab.parentTabGroup, this);
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
