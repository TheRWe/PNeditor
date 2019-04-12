import "./PNet";
import { Place, Arc, Transition, Position, PNet } from "./PNet";
import * as d3 from 'd3';
import { rgb } from "d3";
import { html } from "./Constants";
import { GetArcEndpoints } from "./EditorHelpers/ArrowEndpointCalculationHelper";

type d3Drag = d3.DragBehavior<Element, {}, {} | d3.SubjectPosition>;


export class DrawModel {

    public data: { net: PNet, file: string | null, selected: { places: Place[], tranisitons: Transition[] } } = null;

    private readonly selector = {
        places: () => d3.select("#" + html.id.g.places).selectAll("g").data((this.data.net || { places: [] as Place[] }).places),
        transitions: () => d3.select("#" + html.id.g.transitions).selectAll("g").data((this.data.net || { transitions: [] as Transition[] }).transitions),
        arcs: () =>
            d3.select("#" + html.id.g.arcs).selectAll("g")
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
        svg: new Callbacks<SVGSVGElement>()
    }

    // todo classed všechny možné definice budou v css
    /** immediately apply changes in data to DOM */
    private _update() {
        if (!this.data)
            return;

        const data = this.data;
        const net = data.net;

        console.debug("%c update", "color: rgb(0, 160, 160)");

        const defsNames = html.classes.defs;
        const netSelectors = this.selector;

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
                .on("click", this.callbacks.place.onClick)
                .on("contextmenu", this.callbacks.place.onContextMenu)
                .on("wheel", this.callbacks.place.onWheel)
                .classed(html.classes.place.g, true);
        // todo: any ? (taky u transition)
        (placesEnterGroup as any).call(this.callbacks.place.onDrag);
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
                .on("click", this.callbacks.transition.onClick)
                .on("contextmenu", this.callbacks.transition.onContextMenu)
                .on("wheel", this.callbacks.transition.onWheel)
                .classed(html.classes.transition.g, true);
        (transitionEnterGroup as any).call(this.callbacks.transition.onDrag);

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
            .on("click", this.callbacks.arc.onClick)
            .on("contextmenu", this.callbacks.arc.onContextMenu)
            .on("wheel", this.callbacks.arc.onWheel);


        enterArc
            .append("text")
            .classed("unselectable", true)
            .attr("text-anchor", "middle")
            .attr("dy", ".3em")
            .attr("font-size", 10)
            .datum(x => x.arc)
            .on("click", this.callbacks.arc.onClick);



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
}

export enum CallbackTypes { 'letfClick', 'rightClick', 'wheel' }
export enum CallbackDragTypes { 'start', 'drag', 'end', 'revert' }
export class Callbacks<type> {
    static readonly distanceDeadzone = 8;

    public AddCallback(type: CallbackTypes.wheel, callback: (obj: type, wheelDeltaY: number) => {}): void;
    public AddCallback(type: CallbackTypes.letfClick, callback: (obj: type, pos: Position) => {}): void;
    public AddCallback(type: CallbackTypes.rightClick, callback: (obj: type, pos: Position) => {}): void;
    public AddCallback(type: CallbackTypes, callback: any)
    {
        let old: (obj: type) => void;
        switch (type) {
            case CallbackTypes.letfClick:
                old = this.onClick;
                this.onClick = (...args) => { old(...args); callback(...args); };
                break;
            case CallbackTypes.rightClick:
                old = this.onContextMenu;
                this.onContextMenu = (...args) => { old(...args); callback(...args); };
                break;
            case CallbackTypes.wheel:
                old = this.onWheel;
                this.onWheel = (...args) => { old(...args); callback(...args); };
                break;

            default:
        }
    }


    public AddDragCallback(type: CallbackDragTypes, callback: (obj: type, position: Position) => {}) {
        let old: (obj: type, position: Position) => void;
        switch (type) {
            case CallbackDragTypes.start:
                old = this.onDragStart;
                this.onDragStart = (...args) => {old(...args); callback(...args); };
                break;
            case CallbackDragTypes.drag:
                old = this.onDragDrag;
                this.onDragDrag = (...args) => { old(...args); callback(...args); };
                break;
            case CallbackDragTypes.end:
                old = this.onDragEnd;
                this.onDragEnd = (...args) => { old(...args); callback(...args); };
                break;
            case CallbackDragTypes.revert:
                old = this.onDragDeadzoneRevert;
                this.onDragDeadzoneRevert = (...args) => { old(...args); callback(...args); };
                break;
            default:
        }
    }

    public onClick = (_obj: type) =>{};
    public onContextMenu = (_obj: type) => { };
    public onWheel = (_obj: type) => { };


    private onDragStart = (_obj: type, _position: Position) => { };
    private onDragDrag = (_obj: type, _position: Position) => { };
    private onDragEnd = (_obj: type, _position: Position) => { };
    private onDragDeadzoneRevert = (_obj: type, _position: Position) => { };


    private positionStartDrag: Position;
    public onDrag: d3Drag = d3.drag()
        .clickDistance(Callbacks.distanceDeadzone)
        .on("start", (obj: type) => {
            const { x, y } = (d3.event as Position);
            const evPos = { x, y };
            this.positionStartDrag = evPos;

            this.onDragStart(obj, evPos);
        })
        .on("drag", (obj: type) => {
            const { x, y } = (d3.event as Position);
            const evPos = { x, y };

            this.onDragDrag(obj, evPos);
        })
        .on("end", (obj: type) => {
            const { x, y } = (d3.event as Position);
            const evPos = { x, y };

            const dx = x - this.positionStartDrag.x;
            const dy = y - this.positionStartDrag.y;
            const successfull = (dx * dx + dy * dy > Callbacks.distanceDeadzone * Callbacks.distanceDeadzone);
            if (successfull)
                this.onDragEnd(obj, evPos);
            else
                this.onDragDeadzoneRevert(obj, this.positionStartDrag);

            this.positionStartDrag = null;
        });

}
