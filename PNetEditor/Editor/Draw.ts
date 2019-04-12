import "./PNet";
import { Place, Arc, Transition, Position, PNet } from "./PNet";
import * as d3 from 'd3';
import { rgb, BaseType } from "d3";
import { html, d3BaseSelector } from "./Constants";
import { GetArcEndpoints } from "./EditorHelpers/ArrowEndpointCalculationHelper";

type d3Drag = d3.DragBehavior<Element, {}, {} | d3.SubjectPosition>;


export class DrawModel {

    public data: { net: PNet, file: string | null, selected: { places: Place[], tranisitons: Transition[] } } = null;

    public readonly svg: d3BaseSelector;
    private readonly selector = {
        places: () => this.svg.select("#" + html.id.g.places).selectAll("g").data((this.data.net || { places: [] as Place[] }).places),
        transitions: () => this.svg.select("#" + html.id.g.transitions).selectAll("g").data((this.data.net || { transitions: [] as Transition[] }).transitions),
        arcs: () =>
            this.svg.select("#" + html.id.g.arcs).selectAll("g")
                .data((this.data.net || { arcs: [] as Arc[] }).arcs.map(x => { return { arc: x, line: GetArcEndpoints(this.data.net, x) }; }))
    }

    private updating = false;
    /** schedule redraw function for next animation frame */
    public update() {
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

    public callbacks = {
        transition: new Callbacks<Transition>(),
        arc: new Callbacks<Arc>(),
        place: new Callbacks<Place>(),
        svg: new Callbacks<void>()
    }


    private getPos(): Position {
        const svg = this.svg;
        const coords = d3.mouse(svg.node() as SVGSVGElement);
        const pos = { x: coords[0], y: coords[1] };
        return pos;
    }

    private getWheelDeltaY(): number {
        const e = d3.event;
        console.debug("wheel");
        const deltaY = e.deltaY;
        return deltaY;
    }

    // todo classed všechny možné definice budou v css
    /** immediately apply changes in data to DOM */
    private _update() {
        if (!this.data)
            return;

        const data = this.data;
        const netSelectors = this.selector;
        const svg = this.svg;
        const callbacks = this.callbacks;
        const getPos = this.getPos.bind(this);
        const getWheelDeltaY = this.getWheelDeltaY;

        const net = data.net;

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
                .on("click", (elm) => { callbacks.place.onClick(elm, getPos()); })
                .on("contextmenu", (elm) => { callbacks.place.onContextMenu(elm, getPos()); })
                .on("wheel", (elm) => { callbacks.place.onWheel(elm, getWheelDeltaY()); })
                .classed(html.classes.place.g, true);
        // todo: any ? (taky u transition)
        (placesEnterGroup as any).call(callbacks.place.onDrag);
        const placesEnterCircle =
            placesEnterGroup.append("circle")
                .style("fill", rgb(255, 255, 255).hex())
                .style("stroke", "black")
                .style("stroke-width", "2")
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
                .on("click", (elm) => { callbacks.transition.onClick(elm, getPos()); })
                .on("contextmenu", (elm) => { callbacks.transition.onContextMenu(elm, getPos()); })
                .on("wheel", (elm) => { callbacks.transition.onWheel(elm, getWheelDeltaY()); })
                .classed(html.classes.transition.g, true);
        (transitionEnterGroup as any).call(callbacks.transition.onDrag);

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
        enterArc
            .append("line")
            .classed(html.classes.helper.arcHitboxLine, true)
            .style("stroke", "black")
            .attr("opacity", "0")
            .style("stroke-width", 8)
            .datum((x) => { return x.arc; })
            .on("click", (elm) => { callbacks.arc.onClick(elm, getPos()); })
            .on("contextmenu", (elm) => { callbacks.arc.onContextMenu(elm, getPos()); })
            .on("wheel", (elm) => { callbacks.arc.onWheel(elm, getWheelDeltaY()); });


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

        const selected = data.selected;
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

    constructor(svg: d3BaseSelector) {
        this.svg = svg;

        const svgcallbacks = this.callbacks.svg;
        const getPos = this.getPos.bind(this);
        const getWheelDeltaY = this.getWheelDeltaY;
        svg.on("click", () => { svgcallbacks.onClick(null, getPos()); })
            .on("contextmenu", () => { svgcallbacks.onContextMenu(null, getPos()); })
            .on("wheel", () => { svgcallbacks.onWheel(null, getWheelDeltaY()); });


        console.debug(this);
    }
}

export enum CallbackType { 'letfClick', 'rightClick', 'wheel', 'dragStart', 'drag', 'dragEnd', 'dragRevert' }
export class Callbacks<type> {
    static readonly distanceDeadzone = 8;

    public AddCallback(type: CallbackType.wheel, callback: (obj: type, wheelDeltaY: number) => void): void;
    public AddCallback(type: CallbackType.letfClick, callback: (obj: type, pos: Position) => void): void;
    public AddCallback(type: CallbackType.rightClick, callback: (obj: type, pos: Position) => void): void;
    public AddCallback(type: CallbackType.dragStart | CallbackType.drag | CallbackType.dragEnd | CallbackType.dragRevert
        , callback: (obj: type, pos: Position, startPos?: Position) => void): void;
    public AddCallback(type: CallbackType, callback: any) {
        let old: any;
        switch (type) {
            case CallbackType.letfClick:
                old = this.onClick;
                this.onClick = (...args) => { old(...args); callback(...args); };
                break;
            case CallbackType.rightClick:
                old = this.onContextMenu;
                this.onContextMenu = (...args) => { old(...args); callback(...args); };
                break;
            case CallbackType.wheel:
                old = this.onWheel;
                this.onWheel = (...args) => { old(...args); callback(...args); };
                break;
            case CallbackType.dragStart:
                old = this.onDragStart;
                this.onDragStart = (...args) => { old(...args); callback(...args); };
                break;
            case CallbackType.drag:
                old = this.onDragDrag;
                this.onDragDrag = (...args) => { old(...args); callback(...args); };
                break;
            case CallbackType.dragEnd:
                old = this.onDragEnd;
                this.onDragEnd = (...args) => { old(...args); callback(...args); };
                break;
            case CallbackType.dragRevert:
                old = this.onDragDeadzoneRevert;
                this.onDragDeadzoneRevert = (...args) => { old(...args); callback(...args); };
                break;
            default:
        }
    }

    public onClick = (_obj: type, pos: Position) => { };
    public onContextMenu = (_obj: type, pos: Position) => { };
    public onWheel = (_obj: type, wheelDeltaY: number) => { };

    private onDragStart = (_obj: type, _position: Position, _startPosition: Position) => { };
    private onDragDrag = (_obj: type, _position: Position, _startPosition: Position) => { };
    private onDragEnd = (_obj: type, _position: Position, _startPosition: Position) => { };
    private onDragDeadzoneRevert = (_obj: type, _position: Position, _startPosition: Position) => { };


    private positionStartDrag: Position;
    public onDrag: d3Drag = d3.drag()
        .clickDistance(Callbacks.distanceDeadzone)
        .on("start", (obj: type) => {
            const { x, y } = (d3.event as Position);
            const evPos = { x, y };
            this.positionStartDrag = evPos;

            console.debug({ startDrag: obj, pos: evPos });
            this.onDragStart(obj, evPos, { ...this.positionStartDrag });
        })
        .on("drag", (obj: type) => {
            const { x, y } = (d3.event as Position);
            const evPos = { x, y };

            this.onDragDrag(obj, evPos, { ...this.positionStartDrag });
        })
        .on("end", (obj: type) => {
            const { x, y } = (d3.event as Position);
            const evPos = { x, y };

            const dx = x - this.positionStartDrag.x;
            const dy = y - this.positionStartDrag.y;
            const successfull = (dx * dx + dy * dy > Callbacks.distanceDeadzone * Callbacks.distanceDeadzone);
            if (successfull) {
                console.debug({ endDrag: obj, pos: evPos });
                this.onDragEnd(obj, evPos, { ...this.positionStartDrag });
            }
            else {
                console.debug({ revertDrag: obj, pos: evPos });
                this.onDragDeadzoneRevert(obj, evPos, { ...this.positionStartDrag });
            }

            this.positionStartDrag = null;
        });

}
