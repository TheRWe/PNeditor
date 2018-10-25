import * as d3 from 'd3';
import { PNet, Place, Transition } from './PNet';
import { Key } from 'ts-keycode-enum';
import { Color } from '../Helpers/Color';

export class PNEditor
{
    private net: PNet;
    private readonly svg: d3.Selection<d3.BaseType, {}, HTMLElement, any>;

    //selectors
    private selectors: {
        places: d3.Selection<d3.BaseType, {}, d3.BaseType, any>,
        arcs: d3.Selection<d3.BaseType, {}, d3.BaseType, any>,
        transitions: d3.Selection<d3.BaseType, {}, d3.BaseType, any>,
    };

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

    private updateData()
    {
        const net = this.net;

        const places = this.selectors.places.data(net.places);
        const transitions = this.selectors.transitions.data(net.transition);

        console.log(net);

        const fixNullPosition = (item: Place | Transition): void =>
        {
            if (item.position == null)
                item.position = {x:0, y:0};
        }

        places
            .enter()
            .each(fixNullPosition)
            .append("circle")
            .style("fill", "none")
            .style("stroke", "black")
            .style("stroke-width","2")
            .attr("r", 10)
           .merge(places) // update + enter
            //.transition()
            .attr("cx", function (p: Place) { return p.position.x; })
            .attr("cy", function (p: Place) { return p.position.y; });

        transitions
            .enter()
            .each(fixNullPosition)
            .append("rect")
            .style("fill", new Color(0, 0, 0).toHex())
            .attr("width", 20)
            .attr("height", 20)
           .merge(transitions) // update + enter
            .attr("x", function (t: Transition) { return t.position.x; })
            .attr("y", function (t: Transition) { return t.position.y; });

        const arcData = net.transition
            .map(t => t.arcs
                .map(a => ({ pPos: a.place.position, tPos: t.position, qty: a.qty })))
            .reduce((a, b) => a.concat(b), [])
            .map(a => (a.qty < 0) ?
                { from: a.tPos, to: a.pPos, qty: -a.qty } :
                { from: a.pPos, to: a.tPos, qty: a.qty });
        const arcs = this.selectors.arcs.data(arcData);

        arcs
            .enter()
            .append("line")
            .style("stroke", "black")
            .style("stroke-width", "1")
           .merge(arcs) // update + enter
            .attr("x1", a => a.from.x)
            .attr("y1", a => a.from.y)
            .attr("x2", a => a.to.x)
            .attr("y2", a => a.to.y);
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

    private InititalizeEditor()
    {
        const svg = this.svg;
        const state = this.state;

        // define arrow markers for graph links
        var defs = svg.append('svg:defs');
        defs.append('svg:marker')
            .attr('id', 'end-arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 32)
            .attr('markerWidth', 3.5)
            .attr('markerHeight', 3.5)
            .attr('orient', 'auto')
            .append('svg:path')
            .attr('d', 'M0,-5L10,0L0,5');

        // define arrow markers for leading arrow
        defs.append('svg:marker')
            .attr('id', 'mark-end-arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 7)
            .attr('markerWidth', 3.5)
            .attr('markerHeight', 3.5)
            .attr('orient', 'auto')
            .append('svg:path')
            .attr('d', 'M0,-5L10,0L0,5');

        // line displayed when dragging new nodes
        const dragLine = svg
            .append('svg:path')
            .attr('class', 'link dragline hidden')
            .attr('d', 'M0,0L0,0')
            .style('marker-end', 'url(#mark-end-arrow)');

        const G = svg.append("g");

        this.selectors = {
            arcs: G.append("g").selectAll("g"),
            places: G.append("g").selectAll("circle"),
            transitions: G.append("g").selectAll("rect")
        };
        
        this.updateData();

    }

    constructor(svgElement: d3.Selection<d3.BaseType, {}, HTMLElement, any>)
    {
        this.svg = svgElement;
        this.net = new PNet();


        //testing todo: smazat
        const net = this.net;
        net.places.push(new Place(0, "", { x: 50, y: 100}));
        net.places.push(new Place(1, "", { x: 30, y: 70 }));

        net.transition.push(new Transition({ x: 200, y: 50 }));

        net.transition[0].arcs = [{ place: net.places[0], qty: 10 }];

        this.InititalizeEditor();

        //this.svg = d3.select(this.svgElement);

        //this.SVG = new SVG(300, 300);

        //this.SVG.HTMLElement.addEventListener("mousedown", e =>
        //{
        //    // 0 left, 1 middle, 2 right
        //    if (e.button !== 0) return;

        //    let p: Place = new Place(this, this.SVG);
        //    p.svg.position.x = e.offsetX;
        //    p.svg.position.y = e.offsetY;
        //    e.stopPropagation();
        //});
    }
}