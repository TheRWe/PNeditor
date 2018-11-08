import * as d3 from 'd3';
import { PNet, Place, Transition, Position } from './PNet';
import { Key } from 'ts-keycode-enum';
import { AECH } from './EditorHelpers/ArrowEndpointCalculationHelper';
import { rgb } from 'd3';

// todo: invariant with force
export class PNEditor
{
    private net: PNet;
    private readonly svg: d3.Selection<d3.BaseType, {}, HTMLElement, any>;

    private readonly AECH: AECH;

    private readonly dragline: d3.Selection<d3.BaseType, { }, d3.BaseType, any>;

    private path: any;

    private selectedNode: any = null;
    private selectedLink: any = null;
    private mousedownLink: any = null;
    private mousedownNode: any = null;
    private mouseupNode: any = null;

    private resetMouseVars()
    {
        this.mousedownNode = null;
        this.mouseupNode = null;
        this.mousedownLink = null;
    }

    /**apply changes in data to DOM */
    private update()
    {
        const net = this.net;

        const defsNames = this.html.names.classes.defs;
        const places = () => d3.select("#" + this.html.names.id.g.places).selectAll("g").data(net.places);
        const transitions = () => d3.select("#" + this.html.names.id.g.transitions).selectAll("rect").data(net.transitions);
        const arcs = () =>
            d3.select("#" + this.html.names.id.g.arcs).selectAll("line")
                .data(net.AllArces.map(x => this.AECH.GetArcEndpoints(x)));
        console.log("#" + this.html.names.id.g.arcs);
        console.log("update");

        const fixNullPosition = (item: Place | Transition): void =>
        {
            if (item.position == null)
                item.position = { x: 0, y: 0 };
        }

        const grup =
            places()
                .enter()
                .each(fixNullPosition)
                .append("g")
                .on("click", this.mouse.place.onClick)
                .classed(this.html.names.classes.place, true);
        grup.append("circle")
            .style("fill", rgb(255, 255, 255).hex())
            .style("stroke", "black")
            .style("stroke-width", "2")
            .attr("r", 10)
        grup.append("text")
            .text("AA");

        places()
            .attr("transform", (p: Place) => `translate(${p.position.x}, ${p.position.y})`)

        transitions()
           .enter()
            .each(fixNullPosition)
           .append("rect")
            .on("click", this.mouse.transition.onClick)
            .style("fill", rgb(0, 0, 0).hex())
            .attr("width", 20)
            .attr("height", 20)
            .attr("x", -10)
            .attr("y", -10);
        transitions()
            .attr("x", function (t: Transition) { return t.position.x-10; })
            .attr("y", function (t: Transition) { return t.position.y-10; });

        arcs()
            .enter()
            .append("line")
            .style("stroke", "black")
            .style("stroke-width", 1.5)
        arcs()
            .style('marker-end', a => `url(#${a.endsIn === "T" ? defsNames.arrowTransitionEnd : defsNames.arrowPlaceEnd})`)
            .attr("x1", a => a.from.x)
            .attr("y1", a => a.from.y)
            .attr("x2", a => a.to.x)
            .attr("y2", a => a.to.y)
           .exit().call(x => { console.log(x) }).remove();

        console.log(this.net);

        places().exit().remove();
        transitions().exit().remove();
    }

    private state: {} = {
        selectedNode: null,
        selectedEdge: null,
        mouseDownNode: null,
        mouseDownLink: null,
        justDragged: false,
        justScaleTransGraph: false,
        lastKeyDown: -1,
        shiftNodeDrag: false,
        selectedText: null
    };

    private readonly html = {
        names: {
            id: {
                g: {
                    arcs: "type-arcs",
                    places: "type-places",
                    transitions: "type-transitions"
                }
            },
            classes: {
                defs: {
                    arrowTransitionEnd: "defs-arrow-t-end",
                    arrowPlaceEnd: "defs-arrow-p-end"
                },
                arc: "arc",
                transition: "transition",
                place: "place"
            }
        }
    }


    //#region Mouse

    private InitMouseEvents()
    {
        this.svg.on("click", this.mouse.svg.onClick);
    }

    private readonly mouse = {
        mode: new MouseModeCls(),
        svg: {
            onClick: () =>
            {
                console.log("svg click");

                const mouse = this.mouse;
                switch (mouse.mode.main) {
                    case mainMouseModes.normal:
                        this.net.transitions.push(new Transition(mouse.getPosition()));
                        this.update();
                        break;
                    case mainMouseModes.arcMake:
                        const addedPlace = this.net.AddPlace(mouse.getPosition());
                        this.net.AddArc(mouse.mode.arcMakeHolder as Transition, addedPlace, 1);
                        this.mouseEndArc();
                        this.update();
                        break;
                    default:
                }
            }
        },
        transition: {
            onClick: (t: Transition) =>
            {
                console.debug("transition click");

                const mouse = this.mouse;
                switch (mouse.mode.main) {
                    case mainMouseModes.normal:
                        this.mouseStartArc(t.position, t);
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
            onClick: (p: Place) =>
            {
                const mouse = this.mouse;
                switch (mouse.mode.main) {
                    case mainMouseModes.normal:
                        //todo: marking
                        console.log("markings change");
                        d3.event.stopPropagation();
                        break;
                    default:
                }
            }
        },
        /** returns PNet Position relative to main svg element*/
        getPosition: (): Position =>
        {
            const coords = d3.mouse(this.svg.node() as SVGSVGElement);
            return { x: coords[0], y: coords[1] };
        }
    }

    private mouseStartArc(pos: Position, tp: Transition | Place)
    {
        this.mouse.mode.main = mainMouseModes.arcMake;
        this.mouse.mode.arcMakeHolder = tp;

        const mousePos = this.mouse.getPosition();
        this.dragline
            .attr("visibility", null)
            .attr("x1", pos.x)
            .attr("y1", pos.y)
            .attr("x2", mousePos.x)
            .attr("y2", mousePos.y);

        //todo metody start drag, stop drag
        this.svg.on("mousemove", e =>
        {
            const mousePos = this.mouse.getPosition();
            this.dragline
                .attr("x2", mousePos.x)
                .attr("y2", mousePos.y);
        })

    }

    private mouseEndArc(toMode: mainMouseModes = mainMouseModes.normal)
    {
        this.mouse.mode.main = toMode;
        this.mouse.mode.arcMakeHolder = null;

        this.svg.on("mousemove", null);

        this.dragline
            .attr("visibility", "hidden")
            .attr("x1", null)
            .attr("y1", null)
            .attr("x2", null)
            .attr("y2", null);
    }

    //#endregion

    //todo force for nearby objects(disablable in settings)

    constructor(svgElement: d3.Selection<d3.BaseType, {}, HTMLElement, any>)
    {
        this.svg = svgElement;
        this.net = new PNet();
        this.AECH = new AECH(this.net);

        //testing todo: smazat
        const net = this.net;
        net.places.push(new Place(0, "", { x: 25, y: 100 }));
        net.places.push(new Place(1, "", { x: 180, y: 120 }));
        net.places.push(new Place(2, "", { x: 260, y: 20 }));
        net.places.push(new Place(3, "", { x: 180, y: 20 }));
        net.places.push(new Place(4, "", { x: 60, y: 50 }));
        net.places.push(new Place(5, "", { x: 40, y: 20 }));
        net.places.push(new Place(6, "", { x: 200, y: 100 }));
        net.places.push(new Place(7, "", { x: 220, y: 20 }));

        net.transitions.push(new Transition({ x: 200, y: 50 }));

        net.transitions[0].arcs = [
            { place: net.places[0], qty: 10 },
            { place: net.places[1], qty: 10 },
            { place: net.places[2], qty: -10 },
            { place: net.places[3], qty: -10 },
            { place: net.places[4], qty: 10 },
            { place: net.places[5], qty: 10 },
            { place: net.places[6], qty: 10 },
            { place: net.places[7], qty: 10 },
        ];

        // initialize editor

        const svg = this.svg;
        const defs = svg.append('svg:defs');
        const state = this.state;
        const defsNames = this.html.names.classes.defs;

        const G = svg.append("g");


        G.append("g").attr("id", this.html.names.id.g.arcs);
        G.append("g").attr("id", this.html.names.id.g.places);
        G.append("g").attr("id", this.html.names.id.g.transitions);
        this.dragline = G.append("line");


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

        this.dragline
            .style("stroke", "black")
            .style("stroke-width", 1.5)
            .style("marker-mid", a => `url(#${defsNames.arrowTransitionEnd})`)
            .attr("visibility", "hidden");


        this.InitMouseEvents();
        this.update();
    }
}

//todo RUNMODES
enum mainMouseModes
{
    normal = "normal",
    delete = "delete",
    edit = "edit",
    selection = "selection",
    multiSelect = "multi-selection",
    arcMake = "arc-make"
};
class MouseModeCls
{
    public main: mainMouseModes = mainMouseModes.normal;
    public selectionHardToggle: boolean = false;

    /** holds object for creating arcs */
    public arcMakeHolder: Transition | Place | null = null;
}