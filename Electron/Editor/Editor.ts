import * as d3 from 'd3';
import { PNet, Place, Transition, Position, Arc } from './PNet';
import { Key } from 'ts-keycode-enum';
import { GetArcEndpoints } from './EditorHelpers/ArrowEndpointCalculationHelper';
import { rgb } from 'd3';
import { typedNull } from '../Helpers/purify';
import * as file from 'fs';

// todo: definice rozdělit do souborů (class extend/ definice metod bokem pomocí (this: cls))
// todo: invariant with force
export class PNEditor {
    private net: PNet;

    //#region File

    // todo: ukládat do app.getPath('userData')
    // todo: implicitní verzování ?
    public autoSavePath = "autoSavedNet.pnet.json";

    public AutoSave(): boolean { return this.Save(this.autoSavePath); }
    public AutoLoad(): boolean { return this.Load(this.autoSavePath); }

    /** Saves current net to given path */
    public Save(path: string | number | Buffer | URL): boolean {
        const stringJSON = this.net.toString();
        try {
            file.writeFileSync(path, stringJSON, { encoding: "utf8" });
        } catch {
            return false;
        }
        console.log("%c net SAVED", "color: rgb(0, 0, 255)");
        return true;
    }

    /** load net from given path */
    public Load(path: string | number | Buffer | URL): boolean {
        let objString: string;
        try {
            objString  = file.readFileSync(path, { encoding: "utf8" });
        } catch{
            return false;
        }
        // todo: lepším způsobem zaručit animace(bez NewNet)
        this.NewNet();

        this.net = PNet.fromString(objString);
        console.log("%c LOADED net", "color: rgb(0, 0, 255)");
        console.log(this.net);
        this.update();
        return true;
    }

    // todo: záložky ?
    public NewNet() {
        this.net = new PNet();
        this.update();
    }

	//#endregion


    //#region HTML

    /** helper for manipulating with html nodes*/
    private readonly html = {
        /** D3 selectors for elements */
        selectors: {
            /** main div element */
            div: typedNull<d3.Selection<d3.BaseType, {}, HTMLElement, any>>(),
            /** svg PN view */
            svg: typedNull<d3.Selection<d3.BaseType, {}, HTMLElement, any>>(),
            /** control buttons - holders */
            controlBar: {
                /** div */
                baseDiv: typedNull<d3.Selection<d3.BaseType, {}, HTMLElement, any>>(),
                /** always shown buttons */
                main: {
                 div: typedNull<d3.Selection< d3.BaseType, { }, HTMLElement, any >> (),
                },
                /** run dependent butons */
                run: {
                    div: typedNull<d3.Selection<d3.BaseType, {}, HTMLElement, any>>(),
                },
                /** edit dependent butons */
                edit: {
                    div: typedNull<d3.Selection<d3.BaseType, {}, HTMLElement, any>>(),
                }
            },
            arcDragLine: typedNull<d3.Selection<d3.BaseType, {}, HTMLElement, any>>(),
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
                arc: { g: "arc" },
                transition: { g: "transition" },
                place: { g: "place", svgCircle: "placeSVGCircle" }
            }
        }
    }

	//#endregion


    //#region Update

    // todo classed všechny možné definice budou v css
    /** apply changes in data to DOM */
    private update()
    {
        const net = this.net;

        console.debug("%c update", "color: rgb(0, 160, 160)");

        const defsNames = this.html.names.classes.defs;
        const places = () => d3.select("#" + this.html.names.id.g.places).selectAll("g").data(net.places);
        const transitions = () => d3.select("#" + this.html.names.id.g.transitions).selectAll("rect").data(net.transitions);
        const arcs = () =>
            d3.select("#" + this.html.names.id.g.arcs).selectAll("g")
                .data(net.AllArces.map(x => { return { arc: x, line: GetArcEndpoints(x) }; }));

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
                .classed(this.html.names.classes.place.g, true);
        (placesEnterGroup as any).call(this.mouse.dragPositionMove);
        const placesEnterCircle =
            placesEnterGroup.append("circle")
                .style("fill", rgb(255, 255, 255).hex())
                .style("stroke", "black")
                .style("stroke-width", "2")
                .attr("r", 10)
                .classed(this.html.names.classes.place.svgCircle, true);
        //todo: kolečka pro nízké počty
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

        const transitionEnterRect =
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
        (transitionEnterRect as any).call(this.mouse.dragPositionMove);
        transitions()
            .attr("x", function (t: Transition) { return t.position.x-10; })
            .attr("y", function (t: Transition) { return t.position.y - 10; })
            .style("fill", t => net.IsTransitionEnabled(t) ? rgb(0, 128, 0).hex() : rgb(0, 0, 0).hex());

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
            .on("click", (x) => this.mouse.arc.onClickHitbox(x.arc));

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
            .attr("x", a => Math.abs(a.line.to.x - a.line.from.x)/2 + Math.min(a.line.to.x, a.line.from.x)-5)
            .attr("y", a => Math.abs(a.line.to.y - a.line.from.y) / 2 + Math.min(a.line.to.y, a.line.from.y) - 5)
            .text(d => Math.abs(d.arc.qty.value) || "");

        // todo: kontrola
        arcs().exit().call(() => {}).remove();

        places().exit().remove();
        transitions().exit().remove();
    }

	//#endregion


    //#region Mouse

    /** initialize keyboard *on* handlers related to mouse */
    private InitMouseEvents()
    {
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
        mode: new MouseModeCls(),
        resetState: () => {
            switch (this.mouse.mode.current) {
                case mouseModes.arcMake:
                    this.mouseEndArc();

                    this.mouse.mode.current = mouseModes.normal;
                    break;
                case mouseModes.valueEdit:
                    this.EndInputArc();
                    this.EndInputMarking();

                    this.mouse.mode.current = mouseModes.normal;
                    break;
                default:
                    break;
            }
        },
        svg: {
            onClick: () =>
            {
                const mouse = this.mouse;
                switch (mouse.mode.current) {
                    case mouseModes.normal:
                        this.net.transitions.push(new Transition(mouse.svg.getPosition()));
                        this.update();
                        break;
                    case mouseModes.arcMake:
                        this.mouseEndArc("new");
                        this.update();
                        break;
                    case mouseModes.valueEdit:
                        //todo: bude uloženo v settings
                        this.EndInputMarking();
                        this.EndInputArc();
                        break;
                    default:
                }
            },
            /** returns PNet Position relative to main svg element */
            getPosition: (): Position => {
                const coords = d3.mouse(this.html.selectors.svg.node() as SVGSVGElement);
                return { x: coords[0], y: coords[1] };
            }
        },
        controlBar: {
            main: {
                runToggle: {
                    onChange: (_: any, i: number, nodes: d3.BaseType[] | d3.ArrayLike<d3.BaseType>) => {
                        const elm = d3.select(nodes[i]);
                        const checked = (elm.property("checked") as boolean);
                        this.mouse.controlBar.main.runToggle.onCheckedChange(checked);
                    },

                    onCheckedChange: (checked: boolean) => {
                        this.mouse.resetState();

                        const controlBarRun = this.html.selectors.controlBar.run.div
                            .style("display", "none");
                        const controlBarEdit = this.html.selectors.controlBar.edit.div
                            .style("display", "none");

                        if (checked) {
                            controlBarRun
                                .style("display", "inline-block");
                            this.mouse.mode.current = mouseModes.run;
                        } else {
                            controlBarEdit
                                .style("display", "inline-block");
                            // todo: nahradit za edit
                            this.mouse.mode.current = mouseModes.normal;
                        }
                    }
                }
            }
        },
        transition: {
            onClick: (t: Transition) =>
            {
                const mouse = this.mouse;
                switch (mouse.mode.current) {
                    case mouseModes.normal:
                        this.mouseStartArc(t);
                        d3.event.stopPropagation();
                        break;
                    case mouseModes.arcMake:
                        this.mouseEndArc();
                        d3.event.stopPropagation();
                        break;
                    case mouseModes.run:
                        if (this.net.RunTransition(t))
                            this.update();
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
                switch (mouse.mode.current) {
                    case mouseModes.valueEdit:
                    case mouseModes.normal:
                        if (p.marking == null) p.marking = 0;

                        this.EndInputMarking();
                        this.EndInputArc();

                        this.StartInputMarking(p);
                        d3.event.stopPropagation();
                        break;
                    case mouseModes.arcMake:
                        this.mouseEndArc(p);

                        d3.event.stopPropagation();
                        this.update();
                        break;
                    default:
                }
            }
        },
        arc: {
            onClickHitbox: (a: Arc) =>
            {
                console.debug("arc-hitbox clicked")

                const mouse = this.mouse;
                switch (mouse.mode.current) {
                    case mouseModes.valueEdit:
                    case mouseModes.normal:
                        this.EndInputMarking();
                        this.EndInputArc();

                        this.StartInputArc(a);
                        d3.event.stopPropagation();
                        break;
                    default:
                }
            }
        },
        dragPositionMove:
            d3.drag()
                .on("start", (d) => {
                    console.debug({ startdrag: d });
                })
                .on("drag", (d: { position: Position }) => {
                    const evPos = (d3.event as Position);
                    d.position.x = evPos.x;
                    d.position.y = evPos.y;
                    this.update();
                })
                .on("end", () => { console.debug("enddrag") })

    }

    /**
     * start arc from given transition or place
     * @param tp transition or place
     */
    private mouseStartArc(tp: Transition | Place)
    {
        this.mouse.mode.current = mouseModes.arcMake;
        this.mouse.mode.arcMakeHolder = tp;

        const mousePos = this.mouse.svg.getPosition();
        this.html.selectors.arcDragLine
            .style("display", null)
            .attr("x1", tp.position.x)
            .attr("y1", tp.position.y)
            .attr("x2", mousePos.x)
            .attr("y2", mousePos.y);

        //todo metody start drag, stop drag
        this.html.selectors.svg.on("mousemove", e =>
        {
            const mousePos = this.mouse.svg.getPosition();
            this.html.selectors.arcDragLine
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
        this.mouse.mode.current = this.mouse.mode.prev;

        //todo: nebezpečné, vymyslet alternativu
        this.html.selectors.svg.on("mousemove", null);

        this.html.selectors.arcDragLine
            .style("display", "none")
            .attr("x1", null)
            .attr("y1", null)
            .attr("x2", null)
            .attr("y2", null);

        if (ending == null)
            return;

        if (ending === "new") {
            if (this.mouse.mode.arcMakeHolder instanceof Transition) {
                const addedPlace = this.net.AddPlace(this.mouse.svg.getPosition());
                this.net.AddArc(this.mouse.mode.arcMakeHolder as Transition, addedPlace, 1);
            } else if (this.mouse.mode.arcMakeHolder instanceof Place) {
                //todo place making
                console.error("make transition");
            }
        }
        else if (ending instanceof Place)
        {
            if (this.mouse.mode.arcMakeHolder instanceof Transition) {
                console.debug("connecting place")
                this.net.AddArc(this.mouse.mode.arcMakeHolder as Transition, ending, 1);
            } else {
                //todo: hlaška nebo vyrvoření place mezi dvěma transitions
                console.error("can't connect two transitions");
            }
        }
        else
        {
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
                onKeyPress: () =>
                {
                    if (d3.event.keyCode == Key.Enter) {
                        this.EndInputMarking(true);
                        this.update();
                    }

                    d3.event.stopPropagation();
                },
                /** marking editor input */
                selectors: {
                    foreign: typedNull <d3.Selection<d3.BaseType, {}, d3.BaseType, any>>(),
                    input: typedNull <d3.Selection<d3.BaseType, {}, d3.BaseType, any>>(),
                    buttonOK: typedNull <d3.Selection<d3.BaseType, {}, d3.BaseType, any>>()
                },
            },
            arcValue: {
                /** curently edited arc with value edit input */
                editedArc: typedNull<Arc>(),
                onKeyPress: () =>
                {
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

    /** open marking edit window for given place*/
    private StartInputArc(a: Arc)
    {
        if (this.mouse.mode.current !== mouseModes.valueEdit)
            this.mouse.mode.current = mouseModes.valueEdit;

        this.keyboard.inputs.arcValue.editedArc = a;
        const inputArc = this.keyboard.inputs.arcValue.selectors;
        inputArc.foreign.style("display", null);
        const mousePos = this.mouse.svg.getPosition();
        inputArc.foreign.attr("x", mousePos.x - 20);
        inputArc.foreign.attr("y", mousePos.y - 10);

        (inputArc.input.node() as any).value = a.qty.value;
        (inputArc.input.node() as any).focus();
    }

    /**
     * end editing arc value and close window
     * @param save changes propagate to net ?
     */
    private EndInputArc(save: boolean = false)
    {
        if (this.mouse.mode.current === mouseModes.valueEdit)
            this.mouse.mode.current = this.mouse.mode.prev;
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
            this.keyboard.inputs.arcValue.editedArc.qty.value = val;
        }

        this.keyboard.inputs.marking.editedPlace = null;
    }

    /** open marking edit window for given place*/
    private StartInputMarking(p: Place)
    {
        if (this.mouse.mode.current !== mouseModes.valueEdit)
            this.mouse.mode.current = mouseModes.valueEdit;

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
    private EndInputMarking(save: boolean = false)
    {
        if (this.mouse.mode.current === mouseModes.valueEdit)
            this.mouse.mode.current = this.mouse.mode.prev;
        else
            return;

        //todo: misto max hodnoty 999 bude uložená v settings a bude možnost zobrazovat hodnoty place pomocí seznamu a v place bude
        //      zobrazený pouze zástupný znak a hodnota bude v seznamu
        //todo: validace -> pokud neprojde a číslo bude třeba větší než 999 tak nepustí dál a zčervená input
        const inputMarking = this.keyboard.inputs.marking.selectors;
        inputMarking.foreign.style("display", "none");
        inputMarking.foreign.attr("x", null);
        inputMarking.foreign.attr("y", null);

        if (save) {
            let val = +(inputMarking.input.node() as any).value;
            this.keyboard.inputs.marking.editedPlace.marking = val;
        }

        this.keyboard.inputs.marking.editedPlace = null;
    }

	//#endregion


    //#region Constructor

    //todo force for nearby objects(disablable in settings)
    constructor(divElement: d3.Selection<d3.BaseType, {}, HTMLElement, any>)
    {
        this.html.selectors.div = divElement;


        //#region Controlbar

        const controlbarBase = this.html.selectors.controlBar.baseDiv =
            divElement.append("div")
                .style("height", "30px")
                .style("background", rgb(223, 223, 223).hex());

        const controlbarMain = this.html.selectors.controlBar.main.div = controlbarBase.append("div")
            //to show none -> inline-block
            .style("display", "inline-block")
            .style("margin", "5px 5px");

        this.html.selectors.controlBar.edit.div = controlbarBase.append("div")
            .style("margin", "5px 5px")
            .style("display", "inline-block");

        this.html.selectors.controlBar.run.div = controlbarBase.append("div")
            .style("margin", "5px 5px")
            .style("display", "none");

            //#region RunToggle

        const controlbarMainRunToggle = controlbarMain.append("div")
            .classed("onoffswitch", true);

        controlbarMainRunToggle.append("input")
            .attr("type", "checkbox")
            .attr("name", "onoffswitch")
            .classed("onoffswitch-checkbox", true)
            .attr("id", "myonoffswitch")
            .on("change", this.mouse.controlBar.main.runToggle.onChange);

        const controlbarMainRunToggleLabel = controlbarMainRunToggle.append("label")
            .classed("onoffswitch-label", true)
            .attr("for", "myonoffswitch");

        controlbarMainRunToggleLabel.append("span")
            .classed("onoffswitch-inner", true);
            
        controlbarMainRunToggleLabel.append("span")
            .classed("onoffswitch-switch", true);

            //#endregion

	    //#endregion


        //#region Initialize SVG-HTML

        const svg = this.html.selectors.svg = divElement
            .append("svg")
            .attr("width", "100%")
            .attr("height", 600);


        const defs = svg.append('svg:defs');
        const defsNames = this.html.names.classes.defs;

        const G = svg.append("g");

        G.append("g").attr("id", this.html.names.id.g.arcs);
        G.append("g").attr("id", this.html.names.id.g.places);
        G.append("g").attr("id", this.html.names.id.g.transitions);
        this.html.selectors.arcDragLine = G.append("line");


        let markingForeign = G.append("foreignObject")
            .style("display", "none").attr("width", "100%");
        const markingDiv = markingForeign.append("xhtml:div").style("height", "50");

        const inputMarking = this.keyboard.inputs.marking.selectors;
        inputMarking.input = markingDiv.append("xhtml:input");
        inputMarking.buttonOK = markingDiv.append("xhtml:input").attr("type", "button").attr("value", "OK").style("width", "35px");
        inputMarking.foreign = markingForeign;

        inputMarking.input
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

        this.html.selectors.arcDragLine
            .style("stroke", "black")
            .style("stroke-width", 1.5)
            .style("display", "none")
            .style("pointer-events", "none");

	    //#endregion

        this.InitMouseEvents();
        this.InitKeyboardEvents();


        if (!this.AutoLoad()) {
            this.net = new PNet();
            this.update();
        }
    }

	//#endregion

}

//todo RUNMODES
enum mouseModes
{
    normal = "normal",
    del = "del",
    edit = "edit",
    run = "run",
    selection = "selection",
    multiSelect = "multi-selection",
    arcMake = "arc-make",
    valueEdit = "value-edit"
};
class MouseModeCls
{
    // todo: main properta a prev bude private, pokaždé když se změní main tak se nahraje do prev a bude existovat metoda co main a prev prohodí
    private _current: mouseModes = mouseModes.normal;
    private _prev: mouseModes = mouseModes.normal;

    public get prev(): mouseModes {
        return this._prev;
    }

    public get current(): mouseModes{
        return this._current;
    }
    public set current(val: mouseModes) {
        // todo: mousemode zobrazovat v controltabu
        console.debug({ mousemode: val });
        this._prev = this._current;
        this._current = val;
    }

    public selectionHardToggle: boolean = false;

    /** holds object for creating arcs */
    public arcMakeHolder: Transition | Place | null = null;
}