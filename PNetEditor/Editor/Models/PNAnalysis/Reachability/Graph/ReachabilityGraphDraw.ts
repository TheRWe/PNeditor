import { DrawBase, Callbacks } from "../../../_Basic/DrawBase";
import { ReachabilityGraphModel, ReachabilityGraphsTransition, ReachabilityState } from "./ReachabilityGraphModel";
import { html, d3BaseSelector } from "../../../../../CORE/Constants";
import d3 = require("d3");
import { Position } from "./../../../../../CORE/Constants";

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

        const margin = 20;

        this.simulation =
            d3.forceSimulation()
                //.force("charge", d3.forceManyBody().strength(50))
                //.force("center", d3.forceCenter().x(() => (this.width / 2)).y(() => (this.height / 2)))
                .force("colide", d3.forceCollide().radius(15)/*.iterations(5)*/)
                .force('link', d3.forceLink().id((x: any) => x.index).distance(() => 20).strength(() => .2))
                .force("y", d3.forceY().y((d: ReachabilityState, i, arr: ReachabilityState[]) =>
                    (d.depth * (this.height - margin * 2) / Math.max(...arr.map(x => x.depth))) + margin
                ).strength(1))
                .force("x", d3.forceX().x(() => this.width / 2))
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
            .call(d3.drag()
                .on("start", (obj: any) => {
                    //if (!d3.event.active) this.simulation.alphaTarget(0.3).restart();
                    this.simulation.alpha(.2).restart();
                    const { x, y } = (d3.event as Position);
                    obj.fx = x;
                    obj.fy = y;
                })
                .on("drag", (obj: any) => {
                    this.simulation.alpha(.2).restart();
                    const { x, y } = (d3.event as Position);
                    obj.fx = x;
                    obj.fy = y;

                    //d3.event.subject.fx = Math.max(10, Math.min(width - 10, d3.event.x));
                    //d3.event.subject.fy = Math.max(10, Math.min(height - 10, d3.event.y));
                })
                .on("end", (obj) => {
                    //if (!d3.event.active) simulation.alphaTarget(0);
                })
            )
            ;

        states()
            .attr("transform", (d: any) => `translate(${d.x}, ${d.y})`)
            // todo: colorblind
            .attr("fill", d => d.id === 1 ? "green" : "black")
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

        const nodes = states().data();
        const links: ReachabilityGraphsTransition[] = (this.data as any)._transitions;

        (this.simulation.force('link') as any).links([]);
        this.simulation.nodes(nodes);
        // todo: nevím co to dělá ani jak to funguje ale funguje to
        (this.simulation.force('link') as any).links(links.map(x => {
            return { source: nodes.findIndex(y => y.id === x.source), target: nodes.findIndex(y => y.id === x.target), transitionID: x.transitionID };
        }));
    }
}

