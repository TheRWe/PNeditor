import { DrawBase, Callbacks } from "../../Models/_Basic/DrawBase";
import { PNModel } from "../PNet/PNModel";
import { d3BaseSelector } from "../../../CORE/Constants";
import { typedNull } from "../../../Helpers/purify";
import { ReachabilityTree } from "./Reachability/ReachabilityTree";
import { PNAnalysisModel } from "./PNAnalysisModel";

export class PNAnalysisDraw extends DrawBase{
    public models = {
        pnanalysisModel: null as PNAnalysisModel,
    };

    public Callbacks = {
        container: new Callbacks<any>(),
    };

    protected Selectors = {
        rightDiv: null as d3BaseSelector,
    };

    protected _update(): void {
        const PNAnalysisModel = this.models.pnanalysisModel;

        const rightDiv = this.Selectors.rightDiv.html("");

        [
            PNAnalysisModel.numStates + "" /*+ (PNAnalysisModel.isCalculatedAllMarking ? "" : "+");*/,
            PNAnalysisModel.containstOmega ? "No" : "" + PNAnalysisModel.maxMarking + (PNAnalysisModel.isCalculatedAllMarking ? "" : "?"),
            PNAnalysisModel.containstOmega ? "Yes" : "No" + (PNAnalysisModel.isCalculatedAllMarking ? "" : "?"),
            PNAnalysisModel.reversible ? "Yes" : "No",
            PNAnalysisModel.terminates ? "Yes" : "No",
            PNAnalysisModel.deadlockFree ? "Yes" : "No",
        ].forEach(x => {
            rightDiv.append("div")
                .text(x)
                ;
        });


    }

    //private models = {
    //    markingModel: typedNull<PNMarkingModel>(),
    //}

    public setReachabilityTree(markingModel: ReachabilityTree) {
        this.models.pnanalysisModel.tree = markingModel;
        this.update();
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

        this.models.pnanalysisModel = new PNAnalysisModel();
    }
}

