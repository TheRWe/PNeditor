﻿import { Place, Arc, Transition, PNModel } from "./PNModel";
import * as d3 from 'd3';
import { rgb, Selection } from "d3";
import { GetArcEndpoints } from "./Helpers/ArrowEndpointCalculationHelper";
import { arraysDifferences, typedNull } from "./../../../Helpers/purify";
import { DrawBase, Callbacks, CallbackType } from "../_Basic/DrawBase";
import { d3BaseSelector, html, Position } from "../../Constants";

type d3Drag = d3.DragBehavior<Element, {}, {} | d3.SubjectPosition>;

export class PNDraw extends DrawBase<PNModel>{
    public Callbacks = {
        container: new Callbacks<{}>(),
        transition: new Callbacks<Transition>(),
        arc: new Callbacks<Arc>(),
        place: new Callbacks<Place>(),
    };

    protected Selectors = {
        places: () => this.container.select("." + html.classes.PNEditor.g.places).selectAll("g").data((this.data).places),
        transitions: () => this.container.select("." + html.classes.PNEditor.g.transitions).selectAll("g").data((this.data).transitions),
        arcs: () =>
            this.container.select("." + html.classes.PNEditor.g.arcs).selectAll("g")
                .data((this.data).arcs.map(x => { return { arc: x, line: GetArcEndpoints(this.data, x) }; })),
        arcDragLine: typedNull<d3BaseSelector>(),
    };

    public _isArcDragLineVisible = false;
    public get isArcDragLineVisible() { return this._isArcDragLineVisible; };
    /**
     * Show or hides ArcDragLine
     * @param startingFrom
     */
    public ShowArcDragLine(startingFrom: Position | null) {
        const arcDragLine = this.Selectors.arcDragLine;
        const container = this.container;

        if (startingFrom == null) {
            this._isArcDragLineVisible = false;
            //todo: nebezpečné, vymyslet alternativu
            this.container.on("mousemove", null);

            arcDragLine
                .style("display", "none")
                .attr("x1", null)
                .attr("y1", null)
                .attr("x2", null)
                .attr("y2", null);
        } else {
            this._isArcDragLineVisible = true;

            arcDragLine
                .style("display", null)
                .attr("x1", startingFrom.x).attr("x2", startingFrom.x)
                .attr("y1", startingFrom.y).attr("y2", startingFrom.y);

            container.on("mousemove", () => {
                const pos = this.getPos();
                console.debug(pos);

                arcDragLine
                    .attr("x2", pos.x)
                    .attr("y2", pos.y);
            })
        }
    }

    constructor(container: d3BaseSelector) {
        super(container);

        this.initializeContainer();
        this.initializeContainerCallback();
    }

    private initializeContainer() {

        const svg = this.container
            .attr("width", "100%")
            .attr("height", "99vh");

        const defs = svg.append('svg:defs');
        const defsNames = html.classes.PNEditor.defs;

        const G = svg.append("g");

        G.append("g").classed(html.classes.PNEditor.g.arcs, true);
        G.append("g").classed(html.classes.PNEditor.g.places, true);
        G.append("g").classed(html.classes.PNEditor.g.transitions, true);
        this.Selectors.arcDragLine = G.append("line");


        let markingForeign = G.append("foreignObject")
            .style("display", "none").attr("width", "100%");
        const markingDiv = markingForeign.append("xhtml:div").style("height", "50");


        let arcValueForeign = G.append("foreignObject")
            .style("display", "none").attr("width", "100%");
        const arcValueDiv = arcValueForeign.append("xhtml:div").style("height", "50");

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

        this.Selectors.arcDragLine
            .style("stroke", "black")
            .style("stroke-width", 1.5)
            .style("display", "none")
            .style("pointer-events", "none");
    }

    protected _update(): void {
        if (!this.data)
            return;

        const net = this.data;
        const netSelectors = this.Selectors;
        const callbacks = this.Callbacks;
        const getPos = this.getPos.bind(this);
        const getWheelDeltaY = this.getWheelDeltaY;

        console.debug("%c update", "color: rgb(0, 160, 160)");

        const defsNames = html.classes.PNEditor.defs;

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
                .classed(html.classes.PNEditor.place.g, true);
        callbacks.place.ConnectToElement(placesEnterGroup, getPos, getWheelDeltaY);

        // todo: any ? (taky u transition)
        const placesEnterCircle =
            placesEnterGroup.append("circle")
                .attr("r", 10)
                .classed(html.classes.PNEditor.place.svgCircle, true);

        const placeEnterSelect =
            placesEnterGroup.append("circle")
                .style("stroke", "black")
                .style("fill", "none")
                .style("stroke-width", "1.8")
                .style("stroke-dasharray", "5")
                .attr("r", 14.5)
                .classed(html.classes.PNEditor.multiSelection.selectOutline, true);

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
                .classed(html.classes.PNEditor.transition.g, true);

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
                .classed(html.classes.PNEditor.multiSelection.selectOutline, true);
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
            .classed(html.classes.PNEditor.helper.arcVisibleLine, true)
            .style("stroke", "black")
            .style("stroke-width", 1.5);

        const enterArcLine = enterArc
            .append("line")
            .classed(html.classes.PNEditor.helper.arcHitboxLine, true)
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


        arcs().select(`.${html.classes.PNEditor.helper.arcVisibleLine}`)
            .style('marker-end', a => `url(#${a.line.endsIn === "T" ? defsNames.arrowTransitionEnd : defsNames.arrowPlaceEnd})`)
            .attr("x1", a => a.line.from.x)
            .attr("y1", a => a.line.from.y)
            .attr("x2", a => a.line.to.x)
            .attr("y2", a => a.line.to.y);

        arcs().select(`.${html.classes.PNEditor.helper.arcHitboxLine}`)
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
        netSelectors.places().classed(html.classes.PNEditor.multiSelection.selected, false);
        netSelectors.transitions().classed(html.classes.PNEditor.multiSelection.selected, false);

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
}