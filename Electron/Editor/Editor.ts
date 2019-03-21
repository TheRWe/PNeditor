import * as d3 from 'd3';
import { PNet, Place, Transition, Position, Arc } from './PNet';
import { Key } from 'ts-keycode-enum';
import { GetArcEndpoints } from './EditorHelpers/ArrowEndpointCalculationHelper';
import { rgb } from 'd3';
import { typedNull } from '../Helpers/purify';
import * as file from 'fs';
import { setTimeout } from 'timers';

type d3BaseSelector = d3.Selection<d3.BaseType, {}, HTMLElement, any>;
type FilePath = string | number | Buffer | URL;

function notImplemented() { throw Error("not implemented"); }

// todo: definice rozdělit do souborů (class extend/ definice metod bokem pomocí (this: cls))
export class PNEditor {
    private get net(): PNet {
        const tabs = this.tabs;
        return tabs.nets[tabs.selected].net;
    };
    private get currentTab() {
        const tabs = this.tabs;
        return tabs.nets[tabs.selected];
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
    public Load(path: FilePath): boolean {
        let objString: string;
        try {
            objString = file.readFileSync(path, { encoding: "utf8" });
            const jsonNet = JSON.parse(objString);
            const net = (new PNet()).fromJSON(jsonNet);

            // todo: lepším způsobem zaručit animace(bez NewNet)
            this.tabs.AddTab(net, "todo path");
            //this.net = net;

            console.log("%c LOADED net", "color: rgb(0, 0, 255)");
            console.log(this.net);
            this.update();
        } catch (ex) {
            console.error(ex)
            return false;
        }

        return true;
    }

    // todo: záložky ?
    public NewNet() {
        this.tabs.AddTab(new PNet(), "impl");
        this.update();
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
                places: () => d3.select("#" + this.html.names.id.g.places).selectAll("g").data(this.net.places),
                transitions: () => d3.select("#" + this.html.names.id.g.transitions).selectAll("g").data(this.net.transitions),
                arcs: () =>
                    d3.select("#" + this.html.names.id.g.arcs).selectAll("g")
                        .data(this.net.arcs.map(x => { return { arc: x, line: GetArcEndpoints(this.net, x) }; }))
            }
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
                multiSelection: {
                    selectOutline: "select-outline",
                    selected: "selected"
                },
                arc: { g: "arc" },
                transition: { g: "transition" },
                place: { g: "place", svgCircle: "placeSVGCircle" }
            }
        }
    }

    //#endregion


    //#region Graphics

    private updating = false;
    /** schedule redraw function for next animation frame */
    private update() {
        if (this.updating)
            return;
        this.updating = true;
        requestAnimationFrame((() => {
            try {
                this._update();
            } finally {
                this.updating = false;
            }
        }).bind(this));
    }

    // todo classed všechny možné definice budou v css
    /** immediately apply changes in data to DOM */
    private _update() {
        const net = this.net;

        console.debug("%c update", "color: rgb(0, 160, 160)");

        const defsNames = this.html.names.classes.defs;
        const netSelectors = this.html.selectors.net;

        const places = netSelectors.places;
        const transitions = netSelectors.transitions;
        const arcs = netSelectors.arcs;

        const fixNullPosition = (item: Place | Transition): void => {
            if (item.position == null)
                item.position = { x: 0, y: 0 };
        }


        //#region Place

        const placesEnterGroup =
            places()
                .enter()
                .each(fixNullPosition)
                .append("g")
                .on("click", this.mouse.place.onClick)
                .on("contextmenu", this.mouse.place.onRightClick)
                .on("wheel", this.mouse.place.onWheel)
                .classed(this.html.names.classes.place.g, true);
        // todo: any ? (taky u transition)
        (placesEnterGroup as any).call(this.mouse.onDragPositionMove);
        const placesEnterCircle =
            placesEnterGroup.append("circle")
                .style("fill", rgb(255, 255, 255).hex())
                .style("stroke", "black")
                .style("stroke-width", "2")
                .attr("r", 10)
                .classed(this.html.names.classes.place.svgCircle, true);

        const placeEnterSelect =
            placesEnterGroup.append("circle")
                .style("stroke", "black")
                .style("fill", "none")
                .style("stroke-width", "1.8")
                .style("stroke-dasharray", "5")
                .attr("r", 14.5)
                .classed(this.html.names.classes.multiSelection.selectOutline, true);

        //todo: kolečka/tečky pro nízké počty
        const placesEnterText =
            placesEnterGroup.append("text")
                .classed("unselectable", true)
                .attr("text-anchor", "middle")
                .attr("dy", ".3em")
                .attr("font-size", 10)
                .text(d => d.marking || "")
                .classed("txt", true);

        places()
            .attr("transform", (p: Place) => `translate(${p.position.x}, ${p.position.y})`)
        places()
            //todo: scaling
            .select("text")
            .text(d => d.marking || "");

	    //#endregion


        //#region Transitions

        const transitionEnterGroup =
            transitions()
                .enter()
                .each(fixNullPosition)
                .append("g")
                .on("click", this.mouse.transition.onClick)
                .on("contextmenu", this.mouse.transition.onRightClick)
                .on("wheel", this.mouse.transition.onWheel)
                .classed(this.html.names.classes.transition.g, true);
        (transitionEnterGroup as any).call(this.mouse.onDragPositionMove);

        const transitionEnterRect =
            transitionEnterGroup
                .append("rect")
                .style("fill", rgb(0, 0, 0).hex())
                .attr("width", 20)
                .attr("height", 20)
                .attr("x", -10)
                .attr("y", -10);


        const transitionEnterSelect =
            transitionEnterGroup.append("rect")
                .attr("width", 29)
                .attr("height", 29)
                .attr("x", -14.5)
                .attr("y", -14.5)
                .style("fill", "none")
                .style("stroke", "black")
                .style("stroke-width", 1.5)
                .style("stroke-dasharray", 4)
                .style("stroke-opacity", 0.5)
                .style("stroke-linecap", "round")
                .classed(this.html.names.classes.multiSelection.selectOutline, true);
        ;
        transitions()
            .attr("transform", (t: Transition) => `translate(${t.position.x}, ${t.position.y})`)
            //.attr("x", function (t: Transition) { return t.position.x - 10; })
            //.attr("y", function (t: Transition) { return t.position.y - 10; })
            .style("fill", t => net.IsTransitionEnabled(t) ? rgb(0, 128, 0).hex() : rgb(0, 0, 0).hex());

        //#endregion


        //#region Arc

        const enterArc =
            arcs()
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
            .on("click", (x) => this.mouse.arc.onClickHitbox(x.arc))
            .on("contextmenu", (x) => this.mouse.arc.onRightClick(x.arc))
            .on("wheel", (x) => this.mouse.arc.onWheel(x.arc));


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

        // todo: obravování -> pokud šipka z place tak červená jinak zelená (obarvit ají šipku)
        arcs().select('text')
            .attr("x", a => Math.abs(a.line.to.x - a.line.from.x) / 2 + Math.min(a.line.to.x, a.line.from.x) - 5)
            .attr("y", a => Math.abs(a.line.to.y - a.line.from.y) / 2 + Math.min(a.line.to.y, a.line.from.y) - 5)
            .text(d => Math.abs(d.arc.qty) || "");

	    //#endregion


        // todo: kontrola
        arcs().exit().call(() => { }).remove();

        places().exit().remove();
        transitions().exit().remove();
    }

    private readonly tabs = {
        nets: [] as {
            net: PNet, file: string | null, selected: { places: Place[], tranisitons: Transition[] } }[],
        selected: -1,

        AddTab: (net: PNet, file: string | null) => {
            this.tabs.nets.push({ net, file, selected: { places: [], tranisitons: [] } });
            this.tabs.selected = this.tabs.nets.length - 1;

            this.tabs.Update();
        },
        CloseTab: (index: number) => {
            this.tabs.nets.splice(index, 1);
            if (this.tabs.selected > this.tabs.nets.length - 1)
                this.tabs.selected = this.tabs.nets.length - 1;

            this.tabs.Update();
        },
        Update: () => {
            const selector = () => {
                return this.html.selectors.tabs
                    .selectAll("li")
                    .data(this.tabs.nets);
            }

            const liEnter = selector().enter().append("li")
                .style("float", "left")
                .style("display", "inline-block")
                .style("vertical-align", "top")
                .style("list-style-type", "none");

            const radioEnter = liEnter.append("input")
                .attr("type", "radio")
                .attr("name", "tab-net")
                .attr("id", (d, i) => `tab-${i}`)
                .classed("checkbox-tab-radio", true)
                .style("margin", "0")
                .on("change", (d, i) => {
                    this.tabs.selected = i;
                    this.update();
                });

            const labelEnter = liEnter.append("label")
                .attr("for", (d, i) => `tab-${i}`)
                .style("padding", "8px")
                .style("user-select", "none")
                .style("display", "inline-block");

            // todo: static length ?
            const labelDivEnter = labelEnter.append("div")
                .style("all", "unset");

            const buttonEnter = labelEnter.append("button")
                .attr("type", "button")
                .on("click", (d, i) => { this.tabs.CloseTab(i); })
                .style("border", "0")
                .style("border-style", "none")
                .style("background", "none")
                .style("color", "white")
                .text("X");


            const li = selector()
                .select("label div")
                .text(x => x.file);

            const radio = selector()
                .select("input")
                .property("checked", (x, i) => i === this.tabs.selected);

            selector().exit().remove();

            this.update();
        }
    }

    //#endregion


    //#region Mode

    private readonly mode = (() => {
        const editor = this;
        const html = this.html;

        return new class {
            public readonly default: modes = modes.default;
            private _last: modes = modes.default;
            private _selected: modes = modes.default;

            public get selected(): modes { return this._selected; }
            public set selected(v: modes) {
                this._last = this._selected;
                this._selected = v;
                html.selectors.controlBar.mouseDebugState.text(v);
            }

            public get last(): modes { return this._last; }
            public swap(): void { this.selected = this.last; }

            public toggles = { run: typedNull<Toggle>() };

            // used to cancel all undone actions
            public resetState() {
                // todo: toggles.run ? 
                if (this.selected === this.default)
                    return;

                switch (this.selected) {
                    case modes.arcMake:
                        editor.mouseEndArc();
                        break;
                    case modes.valueEdit:
                        editor.EndInputArc(false);
                        editor.EndInputMarking(false);
                        break;
                    // todo: implement state reset
                    default:
                        console.warn("implement");
                        break;
                }
                if (this.toggles.run.State == ToggleState.on)
                    editor.mode.selected = modes.run;
            }
        };
    })()

    //#endregion


    //#region Mouse

    /** initialize keyboard *on* handlers related to mouse */
    private InitMouseEvents() {
        this.html.selectors.svg.on("click", this.mouse.svg.onClick);
        const inputMarking = this.keyboard.inputs.marking.selectors;
        inputMarking.input
            .on("click", () => { d3.event.stopPropagation(); });
        inputMarking.buttonOK
            .on("click", () => { this.EndInputMarking(true); this.update(); d3.event.stopPropagation(); });

        const arcValueMarking = this.keyboard.inputs.arcValue.selectors;
        arcValueMarking.input
            .on("click", () => { d3.event.stopPropagation(); });
        arcValueMarking.buttonOK
            .on("click", () => { this.EndInputArc(true); this.update(); d3.event.stopPropagation(); });
    }

    /** mouse properties */
    private readonly mouse = {
        //todo: oddělat new_
        svg: {
            onClick: () => {
                console.debug("svg clicked");
                const mouse = this.mouse;
                switch (this.mode.selected) {
                    case modes.default:
                        this.net.AddTransition(mouse.svg.getMousePosition());
                        this.update();
                        break;
                    case modes.arcMake:
                        this.mouseEndArc("new");
                        this.update();
                        break;
                    case modes.valueEdit:
                        //todo: bude uloženo v settings jestli má dojít k uložení nebo resetu
                        //this.EndInputMarking();
                        //this.EndInputArc();
                        this.mode.resetState();
                        break;
                    case modes.multiSelect:
                        const selected = this.currentTab.selected;
                        const netSelectors = this.html.selectors.net;
                        const selectedClassName = this.html.names.classes.multiSelection.selected;
                        // todo: zaobalení
                        selected.places = [];
                        selected.tranisitons = [];
                        netSelectors.places().classed(selectedClassName, false);
                        netSelectors.transitions().classed(selectedClassName, false);

                        this.mode.selected = modes.default;

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
                            case modes.default:
                            case modes.multiSelect:
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

                                netSelectors.places()
                                    .classed("selected", elm => isSelected(selectionStart, pos, elm.position))
                                netSelectors.transitions()
                                    .classed("selected", elm => isSelected(selectionStart, pos, elm.position))

                                //d.position.x = evPos.x;
                                //d.position.y = evPos.y;
                                //this.update();
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

                        const tab = this.currentTab.selected;

                        tab.places = places;
                        tab.tranisitons = transitions;

                        console.debug({ endDrag: [...places, ...transitions] });

                        if (places.length + transitions.length > 0) {
                            this.mode.selected = modes.multiSelect;
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
                        //    this.update();
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
                    case modes.default:
                        this.mouseStartArc(t);
                        d3.event.stopPropagation();
                        break;
                    case modes.arcMake:
                        this.mouseEndArc();
                        d3.event.stopPropagation();
                        break;
                    case modes.run:
                        if (this.net.RunTransition(t))
                            this.update();
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
                    case modes.valueEdit:
                    case modes.default:
                        if (p.marking == null) p.marking = 0;

                        this.EndInputMarking();
                        this.EndInputArc();

                        this.StartInputMarking(p);
                        d3.event.stopPropagation();
                        break;
                    case modes.arcMake:
                        // todo: kontrola na to jeslti už na daný place existuje arc a pokud jo ... (todo: analýza chování)
                        this.mouseEndArc(p);

                        d3.event.stopPropagation();
                        this.update();
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
                    case modes.default:
                        if (deltaY < 0) {
                            p.marking++;
                            this.net.AddHist();
                            this.update();
                        } else if (p.marking > 0) {
                            p.marking--;
                            this.net.AddHist();
                            this.update();
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
                    case modes.valueEdit:
                    case modes.default:
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
                    case modes.default:
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
                this.update();
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
                            case modes.multiSelect:
                                const selectedClassName = this.html.names.classes.multiSelection.selected;

                                const objs: { position: Position }[] = [
                                    ...this.html.selectors.net.places()
                                        .filter(`.${selectedClassName}`)
                                        .data(),
                                    ...this.html.selectors.net.transitions()
                                        .filter(`.${selectedClassName}`)
                                        .data()
                                ]
                                objsPos = objs.map(obj => { return { obj, defaultPos: { ...obj.position } } });
                                break;

                            case modes.default:
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
                            case modes.default:
                                d.position.x = evPos.x;
                                d.position.y = evPos.y;
                                this.update();
                                break;

                            case modes.multiSelect:
                                objsPos.forEach(({ obj, defaultPos: { x: defaultX, y: defaultY } }) => {
                                    obj.position.x = dx + defaultX;
                                    obj.position.y = dy + defaultY;
                                })
                                this.update();
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

                        switch (this.mode.selected) {
                            case modes.default:
                            case modes.multiSelect:
                                successfull = (dx * dx + dy * dy > distance * distance);

                                if (successfull) {
                                    console.debug("enddrag");
                                    this.net.AddHist();
                                } else {
                                    console.debug("canceldrag");
                                    d.position.x = posStart.x;
                                    d.position.y = posStart.y;
                                    this.update();
                                }
                                posStart = null;

                                if (!successfull) {
                                    objsPos.forEach(({ obj, defaultPos: { x: defaultX, y: defaultY } }) => {
                                        obj.position.x = defaultX;
                                        obj.position.y = defaultY;
                                    });
                                    this.update();
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
        this.mode.selected = modes.arcMake;
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
                        this.update();
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
                        this.update();
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
        this.update();
    }

    public Redo() {
        this.net.Redo();
        this.update();
    }

    /** open marking edit window for given place*/
    private StartInputArc(a: Arc) {
        if (this.mode.selected !== modes.valueEdit)
            this.mode.selected = modes.valueEdit;

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
        if (this.mode.selected === modes.valueEdit)
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
        if (this.mode.selected !== modes.valueEdit)
            this.mode.selected = modes.valueEdit;

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
        if (this.mode.selected === modes.valueEdit)
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

        const runtgl = this.mode.toggles.run = new Toggle(selectors.controlBar.div, "Run");
        runtgl.OnToggleChange((tlg) => {
            const state = tlg.State;
            if (state === ToggleState.on) {
                this.mode.resetState();
                // todo: ipmlementované v reset state a bude volat jen to
                this.mode.selected = modes.run;
            } else {
                this.mode.resetState();
                this.mode.selected = modes.default;
            }
        });

        //#endregion


        const tabs = selectors.tabs = divElement.append("ul")
            .style("padding", 0)
            .style("clear", "both")
            .style("display", "inline-block")
            .style("background", "black")
            .style("width", "100%")
            .style("margin", "0");

        tabs.append("button")
            .attr("type", "button")
            .on("click", () => { this.NewNet(); })
            .style("border", "0")
            .style("border-style", "none")
            .style("background", "none")
            .style("float", "right")
            .style("color", "white")
            .style("font-size", "20px")
            .style("padding", "5px 9px 5px 9px")
            .style("user-select", "none")
            .text("+");


        //#region Initialize SVG-HTML

        const svg = selectors.svg = divElement
            .append("svg")
            .attr("width", "100%")
            .attr("height", 600);


        const defs = svg.append('svg:defs');
        const defsNames = this.html.names.classes.defs;

        const G = svg.append("g");

        G.append("g").attr("id", this.html.names.id.g.arcs);
        G.append("g").attr("id", this.html.names.id.g.places);
        G.append("g").attr("id", this.html.names.id.g.transitions);
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
        if (loadPath) {
            this.Load(loadPath);
        } else {
            this.NewNet();
        }

        console.debug(this);
        this.update();
    }

    //#endregion

}


enum modes {
    default = "default",
    arcMake = "arc-make",
    valueEdit = "edit",
    run = "run",
    multiSelect = "multi-select",
}

enum ToggleState { on = "on", off = "off", hidden = "hidden" }
class Toggle {

    private _state: ToggleState;
    public get State(): ToggleState {
        return this._state;
    }
    public set State(state: ToggleState) {
        this._changeState(state);
        this.ToggleChanged();
    }

    private _changeState(state: ToggleState) {
        if (this._state === state)
            return;

        this._state = state;
        if (state === ToggleState.hidden) {
            this.baseSelector.style("display", "none");
        }
        else {
            this.baseSelector.style("display", "inline-block");
            if (state === ToggleState.on) {
                this.checkboxSelector.property("checked", true);
            }
            else if (state === ToggleState.off) {
                this.checkboxSelector.property("checked", false);
            }
        }
    }

    // todo: lepší řešení spojování funkcí
    private _toggleChangedHandler = (obj: Toggle) => { };
    public OnToggleChange(handler: (obj: Toggle) => void): void {
        const prevHandler = this._toggleChangedHandler;
        this._toggleChangedHandler = (obj: Toggle) => {
            prevHandler(obj);
            handler(obj);
        }
    }

    private ToggleChanged() {
        this._toggleChangedHandler(this);
    }

    private readonly baseSelector: d3BaseSelector;
    private readonly checkboxSelector: d3BaseSelector;
    public readonly name: string;

    constructor(containerSelector: d3BaseSelector, name: string) {
        this.name = name;

        const baseSelector = this.baseSelector = containerSelector
            .append("div")
            .style("display", "inline-block");

        this._state = ToggleState.off;

        this.checkboxSelector = baseSelector
            .append("input")
            .attr("type", "checkbox")
            .on("change", () => {
                this.State = this.checkboxSelector.property("checked") === true ? ToggleState.on : ToggleState.off;
            })
            .property("checked", false);

        baseSelector
            .append("text")
            .text(this.name);
        this.State = ToggleState.off;
    }
}