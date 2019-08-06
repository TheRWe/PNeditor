import { DrawBase, Callbacks } from "../../Models/_Basic/DrawBase";
import { PNModel, JSONNet } from "../PNet/PNModel";
import { d3BaseSelector } from "../../../CORE/Constants";
import { CoverabilityGraph } from "./Reachability/ReachabilityTree";

export class PNAnalysisDraw extends DrawBase {
    public Models = {
        CoverabilityGraph: null as CoverabilityGraph,
        pnet: null as JSONNet,
    };

    public Callbacks = {
        container: new Callbacks<any>(),
    };

    protected Selectors = {
        rightDiv: null as d3BaseSelector,
    };

    public Clear() {
        const rightDiv = this.Selectors.rightDiv.html("");
        rightDiv.append("p").text("   ");
    }

    protected _update(): void {
        const CoverabilityGraph = this.Models.CoverabilityGraph;

        const rightDiv = this.Selectors.rightDiv.html("");
        if (CoverabilityGraph.calculated)
            [
                "" + CoverabilityGraph.numStates,
                CoverabilityGraph.containstOmega ? "ω" : "" + CoverabilityGraph.maxMarking,
                CoverabilityGraph.terminates ? "Yes" : "No",
                CoverabilityGraph.reversible === null ? "?" : (CoverabilityGraph.reversible ? "Yes" : "No"),
                CoverabilityGraph.deadlockFree ? "Yes" : "No",
                CoverabilityGraph.weaklyLive ? (CoverabilityGraph.live ? "Yes" : "Weakly") : "No",
            ].forEach(x => {
                rightDiv.append("div")
                    .text(x)
                    ;
            });
        else
            this.Clear();
    }

    public setPnet(pnet: JSONNet) {
        if (this.Models.CoverabilityGraph) this.Models.CoverabilityGraph.CancelCalculations();
        this.Models.pnet = pnet;
        this.Models.CoverabilityGraph = new CoverabilityGraph(pnet);
    }

    private InitializeContainer() {
        const container = this.container;
        container
            .style("font-size", "1.2em")
            .style("border", "1px lightgray solid")
            .style("padding", "4px")
            .classed("unselectable", true)
            ;
        const leftDiv = container.append("div")
            .style("display", "inline-block")
            .style("padding-right", ".5em")
            .style("text-align", "right")
            ;
        const rightDiv = this.Selectors.rightDiv = container.append("div")
            .style("display", "inline-block")
            ;

        ["states", "bounded", "terminates", "reversible", "deadlock-free", "live",].forEach(x => {
            leftDiv.append("div")
                .text(x)
                ;
        });
    }

    constructor(container: d3BaseSelector) {
        super(container);
        this.InitializeContainer();
    }
}

