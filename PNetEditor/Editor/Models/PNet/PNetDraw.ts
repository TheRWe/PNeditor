import { Place, Arc, Transition, PNModel } from "./PNetModel";
import * as d3 from 'd3';
import { rgb, Selection } from "d3";
import { html, d3BaseSelector, Position } from "./../../Constants";
import { GetArcEndpoints } from "./Helpers/ArrowEndpointCalculationHelper";
import { arraysDifferences } from "./../../../Helpers/purify";
import { DrawBase, Callbacks, CallbackType } from "../_Basic/DrawBase";
import { PNet } from "../../PNet";
import { selected } from "../../Draw";

type d3Drag = d3.DragBehavior<Element, {}, {} | d3.SubjectPosition>;

export class PNDraw extends DrawBase<PNModel>{
    public Callbacks = {
        container: new Callbacks<{}>(),
        transition: new Callbacks<Transition>(),
        arc: new Callbacks<Arc>(),
        place: new Callbacks<Place>(),
    };
    protected Selectors = {
        places: () => this.container.select("#" + html.id.g.places).selectAll("g").data((this.data || { places: [] as Place[] }).places),
        transitions: () => this.container.select("#" + html.id.g.transitions).selectAll("g").data((this.data || { transitions: [] as Transition[] }).transitions),
        arcs: () =>
            this.container.select("#" + html.id.g.arcs).selectAll("g")
                .data((this.data || { arcs: [] as Arc[] }).arcs.map(x => { return { arc: x, line: GetArcEndpoints(this.data, x) }; }))
    };

    constructor(container: d3BaseSelector) {
        super(container);

        this.initializeContainerCallback();
        this.InitMultiSelect();
    }

    protected _update(): void {
        if (!this.data)
            return;

        const net = this.data;
        const netSelectors = this.Selectors;
        const container = this.container;
        const callbacks = this.Callbacks;
        const getPos = this.getPos.bind(this);
        const getWheelDeltaY = this.getWheelDeltaY;

        console.debug("%c update", "color: rgb(0, 160, 160)");

        const defsNames = html.classes.defs;

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
                .classed(html.classes.place.g, true);
        callbacks.place.ConnectToElement(placesEnterGroup, getPos, getWheelDeltaY);

        // todo: any ? (taky u transition)
        const placesEnterCircle =
            placesEnterGroup.append("circle")
                .attr("r", 10)
                .classed(html.classes.place.svgCircle, true);

        const placeEnterSelect =
            placesEnterGroup.append("circle")
                .style("stroke", "black")
                .style("fill", "none")
                .style("stroke-width", "1.8")
                .style("stroke-dasharray", "5")
                .attr("r", 14.5)
                .classed(html.classes.multiSelection.selectOutline, true);

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
                .classed(html.classes.transition.g, true);

        callbacks.transition.ConnectToElement(transitionEnterGroup, getPos, getWheelDeltaY);

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
                .classed(html.classes.multiSelection.selectOutline, true);
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
            .classed(html.classes.helper.arcVisibleLine, true)
            .style("stroke", "black")
            .style("stroke-width", 1.5);

        const enterArcLine = enterArc
            .append("line")
            .classed(html.classes.helper.arcHitboxLine, true)
            .style("stroke", "black")
            .attr("opacity", "0")
            .style("stroke-width", 8)
            .datum((x) => { return x.arc; })

        callbacks.arc.ConnectToElement(enterArcLine, getPos, getWheelDeltaY);

        enterArc
            .append("text")
            .classed("unselectable", true)
            .attr("text-anchor", "middle")
            .attr("dy", ".3em")
            .attr("font-size", 10)
            .datum(x => x.arc)
            .on("click", (elm) => { callbacks.arc.onClick(elm, getPos()); });


        arcs().select(`.${html.classes.helper.arcVisibleLine}`)
            .style('marker-end', a => `url(#${a.line.endsIn === "T" ? defsNames.arrowTransitionEnd : defsNames.arrowPlaceEnd})`)
            .attr("x1", a => a.line.from.x)
            .attr("y1", a => a.line.from.y)
            .attr("x2", a => a.line.to.x)
            .attr("y2", a => a.line.to.y);

        arcs().select(`.${html.classes.helper.arcHitboxLine}`)
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

        // todo:
        netSelectors.places().classed(html.classes.multiSelection.selected, false);
        netSelectors.transitions().classed(html.classes.multiSelection.selected, false);

        const selected = net.selected;
        if (selected) {
            netSelectors.places()
                .classed("selected", elm => (selected.places as any).includes(elm))
            netSelectors.transitions()
                .classed("selected", elm => (selected.tranisitons as any).includes(elm))
        } else {
            netSelectors.places().classed("selected", false)
            netSelectors.transitions().classed("selected", false)
        }

        // todo: kontrola
        arcs().exit().remove();
        places().exit().remove();
        transitions().exit().remove();
    }


    //#region Multiselect

    public IsSelectionEnabled: boolean = true;

    public AddOnSelectionChanged(callback: (_allSelected: selected, _justSelected?: selected, _unSelected?: selected) => void) {
        const old = this.onSelectionChanged; this.onSelectionChanged = (...args) => { old(...args); callback(...args); }
    }
    private onSelectionChanged = (_allSelected: selected, _justSelected?: selected, _unSelected?: selected) => { };

    private InitMultiSelect() {
        const container = this.container;

        const selectDragRect = container.select("g").append("rect")
            .attr("width", 0)
            .attr("height", 0)
            .attr("x", 0)
            .attr("y", 0)
            .classed("select-outline", true);

        const isSelected = (pos1: Position, pos2: Position, elmPos: Position) => {
            return ((elmPos.x < pos1.x && elmPos.x > pos2.x) || (elmPos.x > pos1.x && elmPos.x < pos2.x))
                && ((elmPos.y < pos1.y && elmPos.y > pos2.y) || (elmPos.y > pos1.y && elmPos.y < pos2.y))
        }

        const callback = new Callbacks<null>();
        callback.DragOverridePositionFunction = (() => {
            return this.getPos();
        }).bind(this);
        //todo: set ?
        let sel: selected = { places: [], transitions: [] };
        let selecting = false;

        const updateSelection = ((pos1: Position, pos2: Position) => {
            const net = this.data;
            const places = this.data.places.filter(elm => isSelected(pos1, pos2, elm.position));
            const transitions = this.data.transitions.filter(elm => isSelected(pos1, pos2, elm.position));

            const placesDifs = arraysDifferences(sel.places, places);
            const transitionsDifs = arraysDifferences(sel.transitions, transitions);
            if (placesDifs.added.length === 0 && placesDifs.removed.length === 0 &&
                transitionsDifs.added.length === 0 && transitionsDifs.removed.length === 0)
                return;

            sel = { places, transitions };

            this.onSelectionChanged(
                { places: [...places], transitions: [...transitions] },
                { places: [...placesDifs.added], transitions: [...transitionsDifs.added] },
                { places: [...placesDifs.removed], transitions: [...transitionsDifs.removed] })
        }).bind(this);

        callback.AddCallback(CallbackType.dragStart, (_: null, __: Position, start: Position) => {
            if (!this.IsSelectionEnabled) {
                selecting = false;
                return;
            }

            selecting = true;

            //todo: more work needed
            if (d3.event.shiftKey) { ; }

            const unselected = sel;
            sel = { places: [], transitions: [] };
            this.onSelectionChanged(sel, { places: [], transitions: [] }, unselected);

            selectDragRect.style("display", "inline")
        });

        callback.AddCallback(CallbackType.drag, (_: null, pos: Position, start: Position) => {
            if (!selecting)
                return;

            const dx = pos.x - start.x;
            if (dx > 0) selectDragRect.attr("width", dx).attr("x", start.x)
            else selectDragRect.attr("width", -dx).attr("x", pos.x)

            const dy = pos.y - start.y;
            if (dy > 0) selectDragRect.attr("height", dy).attr("y", start.y)
            else selectDragRect.attr("height", -dy).attr("y", pos.y)

            updateSelection(pos, start);
        });
        callback.AddCallback(CallbackType.dragEnd, (_: null, pos: Position, start: Position) => {
            if (!selecting)
                return;
            selecting = false;

            selectDragRect
                .style("display", "none")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", 0)
                .attr("height", 0)

            updateSelection(pos, start);
        });

        (container as any).call(callback.onDrag);
    }


	//#endregion
}