import { DrawBase, Callbacks } from "../../Models/_Basic/DrawBase";
import { PNModel, JSONNet } from "../PNet/PNModel";
import { d3BaseSelector } from "../../../CORE/Constants";
import { typedNull } from "../../../Helpers/purify";
import { CoverabilityGraph } from "./Reachability/ReachabilityTree";
import { PNAnalysisModel } from "./PNAnalysisModel";

export class PNAnalysisDraw extends DrawBase {
    public models = {
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
        const CoverabilityGraph = this.models.CoverabilityGraph;

        const rightDiv = this.Selectors.rightDiv.html("");
        if (CoverabilityGraph.calculated)
            [
                CoverabilityGraph.numStates + "" /*+ (PNAnalysisModel.isCalculatedAllMarking ? "" : "+");*/,
                CoverabilityGraph.containstOmega ? "Yes" : "No",
                CoverabilityGraph.containstOmega ? "No" : "" + CoverabilityGraph.maxMarking,
                CoverabilityGraph.terminates ? "Yes" : "No",
                CoverabilityGraph.reversible === null ? "?" : (CoverabilityGraph.reversible ? "Yes" : "No"),
                CoverabilityGraph.deadlockFree ? "Yes" : "No",
                CoverabilityGraph.live === null ? "?" : (CoverabilityGraph.live ? "Yes" : "No"),
                CoverabilityGraph.weaklyLive ? "Yes" : "No",
            ].forEach(x => {
                rightDiv.append("div")
                    .text(x)
                    ;
            });
        else
            this.Clear();
    }

    public setPnet(pnet: JSONNet) {
        if (this.models.CoverabilityGraph) this.models.CoverabilityGraph.CancelCalculations();
        this.models.pnet = pnet;
        this.models.CoverabilityGraph = new CoverabilityGraph(pnet);
    }

    constructor(container: d3BaseSelector) {
        super(container);
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

        ["states", "ω marking", "bounded", "terminates", "reversible", "deadlock-free", "live", "weakly live",].forEach(x => {
            leftDiv.append("div")
                .text(x)
                ;
        });
    }
}

