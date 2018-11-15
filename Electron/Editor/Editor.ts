import * as d3 from 'd3';
import { PNet, Place, Transition, Position } from './PNet';
import { Key } from 'ts-keycode-enum';
import { AECH } from './EditorHelpers/ArrowEndpointCalculationHelper';
import { rgb } from 'd3';
import { typpedNull } from '../Helpers/purify';

// todo: invariant with force
export class PNEditor
{
    private net: PNet;
    /** selector for main svg element */
    private readonly svg: d3.Selection<d3.BaseType, {}, HTMLElement, any>;

    /** line for creating arces */
    private readonly arcDragLine: d3.Selection<d3.BaseType, { }, d3.BaseType, any>;
    /** arc editor input */
    private readonly inputMarking: { foreign: d3.Selection<d3.BaseType, {}, d3.BaseType, any>, input: d3.Selection<d3.BaseType, {}, d3.BaseType, any> };

    // todo classed všechny možné definice budou v css
    /** apply changes in data to DOM */
    private update()
    {
        const net = this.net;

        const defsNames = this.html.names.classes.defs;
        const places = () => d3.select("#" + this.html.names.id.g.places).selectAll("g").data(net.places);
        const transitions = () => d3.select("#" + this.html.names.id.g.transitions).selectAll("rect").data(net.transitions);
        const arcs = () =>
            d3.select("#" + this.html.names.id.g.arcs).selectAll("line")
                .data(net.AllArces.map(x => this.mouse.transition.AECH.GetArcEndpoints(x)));
        console.log("#" + this.html.names.id.g.arcs);
        console.log("update");

        const fixNullPosition = (item: Place | Transition): void =>
        {
            if (item.position == null)
                item.position = { x: 0, y: 0 };
        }

        const placesEnterGroup =
            places()
                .enter()
                .each(fixNullPosition)
                .append("g")
                .on("click", this.mouse.place.onClick)
                .classed(this.html.names.classes.place, true);
        const placesEnterCircle =
            placesEnterGroup.append("circle")
                .style("fill", rgb(255, 255, 255).hex())
                .style("stroke", "black")
                .style("stroke-width", "2")
                .attr("r", 10);
        //todo: kolečka pro nízké počty
        const placesEnterText =
            placesEnterGroup.append("text")
                .classed("unselectable", true)
                .attr("text-anchor", "middle")
                .attr("dy", ".3em")
                .attr("font-size", 10)
                .text(d => d.marking || "");

        places()
            .attr("transform", (p: Place) => `translate(${p.position.x}, ${p.position.y})`)
        places()
            //todo: scaling
            .select("text")
            .text(d => d.marking || "");


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

    /** helper for manipulating with html nodes*/
    private readonly html = {
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

    /** initialize keyboard *on* handlers related to mouse */
    private InitMouseEvents()
    {
        this.svg.on("click", this.mouse.svg.onClick);
        this.inputMarking.input
            .on("click", () => { d3.event.stopPropagation(); });
    }

    /** mouse properties */
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
                        this.mouseEndArc("new");
                        this.update();
                        break;
                    case mainMouseModes.marking:
                        //todo: bude uloženo v settings
                        this.EndInputMarking(false);
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
                        this.mouseStartArc(t);
                        d3.event.stopPropagation();
                        break;
                    case mainMouseModes.arcMake:
                        this.mouseEndArc();
                        d3.event.stopPropagation();
                        break;
                    default:
                }
            },
            /** helper class to identify ending of arcs on transitions */
            AECH: typpedNull<AECH>()
        },
        place: {
            onClick: (p: Place) =>
            {
                const mouse = this.mouse;
                switch (mouse.mode.main) {
                    case mainMouseModes.marking:
                    case mainMouseModes.normal:
                        if (p.marking == null) p.marking = 0;

                        this.StartInputMarking(p);
                        d3.event.stopPropagation();
                        break;
                    default:
                }
            }
        },
        /** returns PNet Position relative to main svg element */
        getPosition: (): Position =>
        {
            const coords = d3.mouse(this.svg.node() as SVGSVGElement);
            return { x: coords[0], y: coords[1] };
        }
    }

    /**
     * start arc from given transition or place
     * @param tp transition or place
     */
    private mouseStartArc(tp: Transition | Place)
    {
        this.mouse.mode.main = mainMouseModes.arcMake;
        this.mouse.mode.arcMakeHolder = tp;

        const mousePos = this.mouse.getPosition();
        this.arcDragLine
            .attr("visibility", null)
            .attr("x1", tp.position.x)
            .attr("y1", tp.position.y)
            .attr("x2", mousePos.x)
            .attr("y2", mousePos.y);

        //todo metody start drag, stop drag
        this.svg.on("mousemove", e =>
        {
            const mousePos = this.mouse.getPosition();
            this.arcDragLine
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
    private mouseEndArc(ending: null | Transition | Place | "new" = null)
    {
        this.mouse.mode.main = this.mouse.mode.prev;

        //todo: nebezpečné, vymyslet alternativu
        this.svg.on("mousemove", null);

        this.arcDragLine
            .attr("visibility", "hidden")
            .attr("x1", null)
            .attr("y1", null)
            .attr("x2", null)
            .attr("y2", null);

        if (ending == null)
            return;

        if (ending === "new") {
            if (this.mouse.mode.arcMakeHolder instanceof Transition) {
                const addedPlace = this.net.AddPlace(this.mouse.getPosition());
                this.net.AddArc(this.mouse.mode.arcMakeHolder as Transition, addedPlace, 1);
            } else if (this.mouse.mode.arcMakeHolder instanceof Place) {
                //todo place making
                console.error("make transition");
            }
        }
        else {
            //todo: propojování
            console.error("connect");
        }

        this.mouse.mode.arcMakeHolder = null;
    }

    //#endregion Mouse


    //#region Keyboard

    /** initialize keyboard *on* handlers related to keyboard */
    private InitKeyboardEvents()
    {
        this.inputMarking.input
            .on("keypress", this.keyboard.inputs.marking.onKeyPress);
    }

    /** keyboard properties */
    private readonly keyboard = {
        /** input element props */
        inputs: {
            marking: {
                /** curently edited place with marking edit input */
                editedPlace: typpedNull<Place>(),
                onKeyPress: () =>
                {
                    if (d3.event.keyCode == Key.Enter) {
                        this.EndInputMarking();
                        this.update();
                    }

                    d3.event.stopPropagation();
                }
            }
        }
    }

    /** open marking edit window for given place*/
    private StartInputMarking(p: Place)
    {
        this.mouse.mode.main = mainMouseModes.marking;
        this.keyboard.inputs.marking.editedPlace = p;
        this.inputMarking.foreign.attr("visibility", "visible");
        this.inputMarking.foreign.attr("x", p.position.x - 20);
        this.inputMarking.foreign.attr("y", p.position.y - 10);

        (this.inputMarking.input.node() as any).value = p.marking || null;
        (this.inputMarking.input.node() as any).focus();
    }

    /**
     * end editing place marking and close window
     * @param save changes propagate to net ?
     */
    private EndInputMarking(save: boolean = true)
    {
        //todo: misto max hodnoty 999 bude uložená v settings a bude možnost zobrazovat hodnoty place pomocí seznamu a v place bude
        //      zobrazený pouze zástupný znak a hodnota bude v seznamu
        //todo: validace -> pokud neprojde a číslo bude třeba větší než 999 tak nepustí dál a zčervená input

        this.inputMarking.foreign.attr("visibility", "hidden");
        this.inputMarking.foreign.attr("x", null);
        this.inputMarking.foreign.attr("y", null);

        if (save) {
            let val = +(this.inputMarking.input.node() as any).value;
            console.log(val);
            this.keyboard.inputs.marking.editedPlace.marking = val;
        }

        this.keyboard.inputs.marking.editedPlace = null;
        this.mouse.mode.main = this.mouse.mode.prev;
    }

	//#endregion

    //todo force for nearby objects(disablable in settings)

    constructor(svgElement: d3.Selection<d3.BaseType, {}, HTMLElement, any>)
    {
        this.svg = svgElement;
        this.net = new PNet();
        this.mouse.transition.AECH = new AECH(this.net);

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
        const defsNames = this.html.names.classes.defs;

        const G = svg.append("g");


        G.append("g").attr("id", this.html.names.id.g.arcs);
        G.append("g").attr("id", this.html.names.id.g.places);
        G.append("g").attr("id", this.html.names.id.g.transitions);
        this.arcDragLine = G.append("line");


        let markingForeign = G.append("foreignObject")
            .attr("visibility", "hidden");

        this.inputMarking = {
            input: markingForeign.append("xhtml:div").append("xhtml:input"),
            foreign: markingForeign
        };

        this.inputMarking.input
            .attr("type", "number")
            .attr("min", 0)
            .attr("max", 999)
            .style("width", "40px")
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

        this.arcDragLine
            .style("stroke", "black")
            .style("stroke-width", 1.5)
            .style("marker-mid", a => `url(#${defsNames.arrowTransitionEnd})`)
            .attr("visibility", "hidden");


        this.InitMouseEvents();
        this.InitKeyboardEvents();
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
    arcMake = "arc-make",
    marking = "mark-modif"
};
class MouseModeCls
{
    // todo: main properta a prev bude private, pokaždé když se změní main tak se nahraje do prev a bude existovat metoda co main a prev prohodí
    public main: mainMouseModes = mainMouseModes.normal;
    public prev: mainMouseModes = mainMouseModes.normal;
    public selectionHardToggle: boolean = false;

    /** holds object for creating arcs */
    public arcMakeHolder: Transition | Place | null = null;
}