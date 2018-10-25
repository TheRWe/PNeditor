"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PNet_1 = require("./PNet");
const Color_1 = require("../Helpers/Color");
class PNEditor {
    constructor(svgElement) {
        this.selectedNode = null;
        this.selectedLink = null;
        this.mousedownLink = null;
        this.mousedownNode = null;
        this.mouseupNode = null;
        this.state = {
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
        this.svg = svgElement;
        this.net = new PNet_1.PNet();
        //testing todo: smazat
        const net = this.net;
        net.places.push(new PNet_1.Place(0, "", { x: 50, y: 100 }));
        net.places.push(new PNet_1.Place(1, "", { x: 30, y: 70 }));
        net.transition.push(new PNet_1.Transition({ x: 200, y: 50 }));
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
    resetMouseVars() {
        this.mousedownNode = null;
        this.mouseupNode = null;
        this.mousedownLink = null;
    }
    updateData() {
        const net = this.net;
        const places = this.selectors.places.data(net.places);
        const transitions = this.selectors.transitions.data(net.transition);
        console.log(net);
        const fixNullPosition = (item) => {
            if (item.position == null)
                item.position = { x: 0, y: 0 };
        };
        places
            .enter()
            .each(fixNullPosition)
            .append("circle")
            .style("fill", "none")
            .style("stroke", "black")
            .style("stroke-width", "2")
            .attr("r", 10)
            .merge(places) // update + enter
            //.transition()
            .attr("cx", function (p) { return p.position.x; })
            .attr("cy", function (p) { return p.position.y; });
        transitions
            .enter()
            .each(fixNullPosition)
            .append("rect")
            .style("fill", new Color_1.Color(0, 0, 0).toHex())
            .attr("width", 20)
            .attr("height", 20)
            .merge(transitions) // update + enter
            .attr("x", function (t) { return t.position.x; })
            .attr("y", function (t) { return t.position.y; });
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
    InititalizeEditor() {
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
}
exports.PNEditor = PNEditor;
//# sourceMappingURL=Editor.js.map