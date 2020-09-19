import * as path from 'path';
import * as d3 from 'd3';
import { Tab, TabKeyDownEvent, BeforeRemoveEvent } from "../components/TabControl/Tab";
import { d3BaseSelector, Position, ForceNode } from "../../definitions/Constants";
import { PNModel, Place, Arc, Transition, GetEnabledTransitionsIDs, CalculateNextConfiguration } from "./PNet/PNModel";
import { PNDraw, arc } from "./PNet/PNDraw";
import { PNAction } from "./PNet/PNAction";
import { CallbackType } from "./_Basic/DrawBase";
import { notImplemented } from "../../CORE/Helpers/purify";
import { PNDrawControls } from "./PNet/Helpers/PNDrawControls";
import { ToggleSwitchState } from "../components/ToggleSwitch";
import { PNDrawInputs } from "./PNet/Helpers/PNDrawInputs";
import { PNAnalysis } from "./PNAnalysis/PNAnalysis";
import { Key } from "ts-keycode-enum";
import { PlaceTransitionTableDraw } from "./PNet/PlaceTransitionTable";
import { groupmap, TabInterface } from "../main";


export class PNEditor implements TabInterface {
    public readonly tab: Tab;
    /** Container under controlbar */
    public readonly underControlContainer: d3BaseSelector;
    public readonly svg: d3BaseSelector;

    public readonly pnModel: PNModel;
    public readonly pnDraw: PNDraw;
    public readonly pnAction: PNAction;

    public readonly tableDraw: PlaceTransitionTableDraw;

    public readonly inputs: PNDrawInputs;
    private readonly controls: PNDrawControls;

    private _analysis: PNAnalysis = null;

    public IsSaveable(): boolean {
        return true;
    }

    public GetStringToSave(): string {
        return JSON.stringify(this.pnModel.toJSON(), null, 2);
    }

    private _path: string = null;
    public get Path(): string {
        return this._path;
    }
    public set Path(val: string) {
        this._path = val;

        const fileWithExtension = path.basename(val);
        const splited = fileWithExtension.split('.');
        const withoutExtension = (splited.length > 1) ? splited.slice(0, -1).join('.') : fileWithExtension;

        const maxlength = 20;

        this.tab.label = (withoutExtension.length > maxlength) ? (withoutExtension.slice(0, maxlength - 3) + '...') : withoutExtension;
    }


    //#region Mode

    private mode: EditorMode = new EditorMode();

    // used to cancel all undone actions
    public resetState() {
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
                        this.pnDraw.simulation.alpha(0.3).restart();
                        this.pnDraw.update();
                        break;
                    case editorMode.arcMake:
                        this.mouseEndArc("new");
                        this.pnDraw.simulation.alpha(0.3).restart();
                        this.pnDraw.update();
                        break;
                    case editorMode.valueEdit:
                        this.resetState();
                        break;
                    default:
                        notImplemented();
                }
            },
            onRightClick: () => {
                switch (this.mode.selected) {
                    case editorMode.arcMake:
                        this.mouseEndArc();
                        break;
                    case editorMode.valueEdit:
                        this.keyboard.inputs.marking.editedPlace = null;
                        this.keyboard.inputs.arcValue.editedArc = null;
                        this.inputs.HideAllInputs();
                        this.mode.swap();
                        break;
                    default:
                        break;
                }
            },
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
                let deltaY = e.deltaY;
                switch (this.mode.selected) {
                    case editorMode.default:
                        t.isCold = !t.isCold;
                        this.pnAction.CallOnModelChange();
                        this.pnDraw.update();
                        this.pnDraw.scrollPreventDefault();
                        break;
                    default:
                        notImplemented();
                }
            },
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
                let deltaY = e.deltaY;
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

                        this.pnDraw.scrollPreventDefault();
                        break;
                    default:
                        notImplemented();
                }
            },
        },
        arc: {
            onClick: (a: arc) => {
                console.debug("arc clicked");

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
            onRightClick: (a: arc) => {
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
            onWheel: (a: arc) => {
                const e = d3.event;
                console.debug("arc wheel");
                let deltaY = e.deltaY;
                switch (this.mode.selected) {
                    case editorMode.default:
                        const toPlace = a.arc.toPlace;
                        a.arc.toPlace = a.arc.toTransition;
                        a.arc.toTransition = toPlace;

                        this.pnAction.CallOnModelChange();
                        this.pnDraw.update();

                        this.pnDraw.scrollPreventDefault();
                        break;
                    default:
                        notImplemented();
                }
                this.pnDraw.update();
            },
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
            arcMakeHolder: null as Place | Transition,
        },
    };

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
                console.error("make transition");
            }
        } else if (ending instanceof Place) {
            if (this.mouse.helpers.arcMakeHolder instanceof Transition) {
                console.debug("connecting place");
                this.pnAction.AddArc(this.mouse.helpers.arcMakeHolder as Transition, ending, 1, null);
            } else {
                //todo: hlaška nebo vyrvoření place mezi dvěma transitions
                console.error("can't connect two transitions");
            }
        } else {
            console.error("connect error");
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

        this.tab.AddOnKeyDownWhenOpened(this.keyboard.shortcuts.callback);
    }

    /** keyboard properties */
    private readonly keyboard = {
        /** input element props */
        inputs: {
            marking: {
                /** curently edited place with marking edit input */
                editedPlace: null as Place,
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
                editedArc: null as Arc,
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
            },
        },
        shortcuts: {
            callback: ((e: TabKeyDownEvent) => {
                console.debug(e);
                if (e.ctrlKey) {
                    switch (e.keyCode) {
                        case Key.Z:
                        case Key.Y:
                        case 26:
                            if (this.mode.selected === editorMode.arcMake)
                                this.mouseEndArc();

                            if (e.shiftKey)
                                this.pnAction.Redo();
                            else
                                this.pnAction.Undo();
                            this.pnDraw.update();
                            break;
                        default:
                            break;
                    }
                }
            }),
        },
    };


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


    //#region Table

    private readonly buttonTableHide: d3BaseSelector;
    private readonly tableContainer: d3BaseSelector;
    private _tableVisible = true;
    public get tableVisible() {
        return this._tableVisible;
    }
    public set tableVisible(v: boolean) {
        this._tableVisible = v;
        if (v) {
            this.buttonTableHide
                .text("⇩")
                ;
            this.tableContainer
                .style("border", "3px lightgray solid")
                .style("max-height", "300px")
                ;
        } else {
            this.buttonTableHide
                .text("⇧")
                ;
            this.tableContainer
                .style("border", "0px lightgray solid")
                .style("max-height", "0px")
                ;
        }
    }

    private _expandTable(configID: number, transitionID: number) {
        const tableModels = this.tableDraw.Models;
        const configs = tableModels.configurations;
        configs.splice(configID + 1);
        const selectedConfig = configs[configID];
        configs.push(CalculateNextConfiguration(tableModels.net, selectedConfig.marking, transitionID));
        selectedConfig.usedTransition = transitionID;
    }

    private _resetTable() {
        const jsonNet = this.pnModel.toJSON();
        this.tableDraw.Models.net = jsonNet;
        const marking = jsonNet.places.map(p => { return { id: p.id, marking: p.marking }; });
        const enabledTransitionsIDs = GetEnabledTransitionsIDs(jsonNet, marking);
        this.tableDraw.Models.configurations = [{ marking, enabledTransitionsIDs }];
        this.tableDraw.update();
    }

    private InitTable() {
        this._resetTable();
        // funguje
        this.pnAction.AddOnModelChange(() => { this._resetTable(); });
        this.tableDraw.AddOnConfigTransitionClick(({ configIndex, transitionID }) => {
            this._expandTable(configIndex, transitionID);
            this.tableDraw.update();
        });
        this.tableDraw.AddOnConfigShowHover(({ configIndex }) => {
            if (configIndex === null)
                this.pnDraw.Models.configuration = null;
            else
                this.pnDraw.Models.configuration = this.tableDraw.Models.configurations[configIndex];
            this.pnDraw.update();
        });
    }

    //#endregion


    //#region Analysis
    private readonly buttonAnalysisHide: d3BaseSelector;
    private readonly analysisContainer: d3BaseSelector;
    private _analysisVisible = true;
    public get analysisVisible() {
        return this._analysisVisible;
    }
    public set analysisVisible(v: boolean) {
        this._analysisVisible = v;
        if (v) {
            this.buttonAnalysisHide
                .text("⇩")
                ;
            this.analysisContainer
                .style("border", "3px lightgray solid")
                .style("max-height", "300px")
                ;
        } else {
            this.buttonAnalysisHide
                .text("⇧")
                ;
            this.analysisContainer
                .style("border", "0px lightgray solid")
                .style("max-height", "0px")
                ;
        }
    }


    //#endregion



    constructor(tab: Tab, pnmodel: PNModel) {
        this.tab = tab;

        tab.label = "Unnamed Net";
        this.tab.container.style("height", "99vh")
            .style("display", "flex")
            .style("flex-direction", "column")
            ;
        const controlDiv = tab.container.append("div");

        const underControlContainer = this.underControlContainer = tab.container.append("div")
            .style("width", "100%")
            .style("flex", "auto")
            .style("position", "relative")
            //.style("overflow", "auto")
            ;

        const svgContainer = underControlContainer
            .append("div")
            .style("min-width", "100%")
            .style("min-height", "100%")
            .style("position", "absolute")
            .style("overflow", "auto")
            ;

        const svg = this.svg = svgContainer.append("svg")
            .style("position", "absolute");

        const tableDiv = this.underControlContainer
            .append("div")
            .style("position", "absolute")
            .style("right", "20px")
            .style("bottom", "20px")
            ;

        const tableHideButton = this.buttonTableHide = tableDiv.append("div")
            .style("width", "35px")
            .style("height", "25px")
            .style("display", "block")
            .style("margin-left", "auto")
            .classed("button", true)
            .text("⇩")
            .on("click", () => {
                this.tableVisible = !this.tableVisible;
            })
            ;

        const tableContainer = this.tableContainer = tableDiv.append("div")
            .style("background", "lightgray")
            .style("max-width", "500px")
            .style("overflow", "auto")
            .style("transition", "border .3s ease, max-height .3s ease")
            .style("display", "block")
            .style("overflow-y", "scroll")
            ;



        const analysisDiv = this.underControlContainer
            .append("div")
            .style("position", "absolute")
            .style("left", "10px")
            .style("bottom", "20px")
            ;

        const analysisButton = this.buttonAnalysisHide = analysisDiv.append("div")
            .style("width", "35px")
            .style("height", "25px")
            .style("display", "block")
            //.style("margin-left", "auto")
            .classed("button", true)
            .text("⇩")
            .on("click", () => {
                this.analysisVisible = !this.analysisVisible;
            })
            ;

        const analysisContainer = this.analysisContainer = analysisDiv.append("div")
            .style("background", "rgba(255,255,255,0.9)")
            .style("transition", "border .3s ease, max-height .3s ease")
            .style("display", "block")
            .style("overflow", "hidden")
            ;



        this.tableDraw = new PlaceTransitionTableDraw(tableContainer);

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
        pnDraw.Models.net = pnmodel;
        this.pnAction.AddOnModelChange(() => {
            this.pnDraw.Models.configuration = null;
        });
        pnDraw.update();

        this._analysis = new PNAnalysis({ analysisContainer: this.analysisContainer }, this.pnModel);
        this.pnAction.AddOnModelChange(() => {
            this._analysis.update();
        });

        this.inputs = new PNDrawInputs(pnDraw);

        this.InitMouseEvents();
        this.InitKeyboardEvents();
        this.InitTable();

        tab.AddOnBeforeRemove((event: BeforeRemoveEvent) => {
            this._analysis = null;
        });

        groupmap.set(tab.parentTabGroup, this);

        this.analysisVisible = true;
        this.tableVisible = true;
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
        };
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
