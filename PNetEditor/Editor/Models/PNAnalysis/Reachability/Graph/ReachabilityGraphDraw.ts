import { DrawBase, Callbacks } from "../../../_Basic/DrawBase";
import { ReachabilityGraphModel } from "./ReachabilityGraphModel";
import { html, d3BaseSelector } from "../../../../../CORE/Constants";
import d3 = require("d3");

export class ReachabilityGraphDraw extends DrawBase<ReachabilityGraphModel> {
    public Callbacks: { container: Callbacks<{}>; };
    protected Selectors = {
        states: () => this.container.select("." + html.classes.ReachabilityGraph.states).selectAll("g").data((this.data).states),
        transitions: () => this.container.select("." + html.classes.ReachabilityGraph.transitions).selectAll("g").data((this.data).transitions),
    };

    public readonly simulation: d3.Simulation<{}, undefined>;

    constructor(container: d3BaseSelector) {
        super(container);
        container.append("g")
            .classed(html.classes.ReachabilityGraph.states, true)
            ;

        container.append("g")
            .classed(html.classes.ReachabilityGraph.transitions, true)
            ;

        this.simulation =
            d3.forceSimulation()
                //.force("charge", d3.forceManyBody().strength(50))
                .force("center", d3.forceCenter((this.width / 2), (this.height / 2)))
                .force("colide", d3.forceCollide().radius(25).iterations(5))
                .on("tick", () => { this.update(); })
            ;
        window.addEventListener("resize", (e) => { this.simulation.alpha(0.5); });
    }


    protected _update(): void {
        const states = this.Selectors.states;
        const transitions = this.Selectors.transitions;
    
        const statesEnter = states()
            .enter()
            .append("g")
            .append("circle")
            .attr("r", 10)
            ;

        states()
            .attr("transform", (d: any) => `translate(${d.x}, ${d.y})`)
            ;

        const transitionsEnter = transitions()
            .enter()
            .append("g")
            .append("line")
            .style("stroke", "black")
            .style("stroke-width", 1.5)
            ;

        transitions()
            .select("line")
            .attr("x1", t => t.from.x)
            .attr("y1", t => t.from.y)
            .attr("x2", t => t.to.x)
            .attr("y2", t => t.to.y)
            ;

        this.simulation.nodes(states().data())
        if (this.width > 0 && this.height > 0) {
            ((this.simulation.force("center")) as d3.ForceCenter<{}>).x(this.width / 2).y(this.height / 2)
        }

    }
}

