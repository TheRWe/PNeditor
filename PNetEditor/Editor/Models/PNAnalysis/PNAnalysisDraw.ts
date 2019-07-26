import { DrawBase, Callbacks } from "../../Models/_Basic/DrawBase";
import { PNModel, JSONNet } from "../PNet/PNModel";
import { d3BaseSelector } from "../../../CORE/Constants";
import { typedNull } from "../../../Helpers/purify";
import { CoverabilityGraph } from "./Reachability/ReachabilityTree";
import { PNAnalysisModel } from "./PNAnalysisModel";

export class PNAnalysisDraw extends DrawBase{
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

    protected _update(): void {
        const CoverabilityGraph = this.models.CoverabilityGraph;

        const rightDiv = this.Selectors.rightDiv.html("");

        [
            CoverabilityGraph.numStates + "" /*+ (PNAnalysisModel.isCalculatedAllMarking ? "" : "+");*/,
            CoverabilityGraph.containstOmega ? "No" : "" + CoverabilityGraph.maxMarking + (CoverabilityGraph.isCalculatedAllMarking ? "" : "?"),
            CoverabilityGraph.containstOmega ? "Yes" : "No" + (CoverabilityGraph.isCalculatedAllMarking ? "" : "?"),
            CoverabilityGraph.reversible ? "Yes" : "No",
            CoverabilityGraph.terminates ? "Yes" : "No",
            CoverabilityGraph.deadlockFree ? "Yes" : "No",
        ].forEach(x => {
            rightDiv.append("div")
                .text(x)
                ;
        });


    }

    public setPnet(pnet: JSONNet) {
        this.models.pnet = pnet;
        const g = this.models.CoverabilityGraph = new CoverabilityGraph(pnet);
        g.Calculate().then(() => {
            this.update();
        })
    }

    constructor(container: d3BaseSelector) {
        super(container);
        container
            .style("font-size", "1.2em")
            .style("border","1px lightgray solid")
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

        ["states", "bounded", "ω marking", "reversible", "terminates", "deadlock-free"].forEach(x => {
            leftDiv.append("div")
                .text(x)
                ;
        });
    }
}

