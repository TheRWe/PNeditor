import { DrawBase, Callbacks } from "../../Models/_Basic/DrawBase";
import { PNModel } from "../PNet/PNModel";
import { d3BaseSelector } from "../../../CORE/Constants";
import { typedNull } from "../../../Helpers/purify";
import { ReachabilityTree } from "./Reachability/ReachabilityTree";
import { PNAnalysisModel } from "./PNAnalysisModel";

export class PNAnalysisDraw extends DrawBase<PNAnalysisModel>{
    public Callbacks = {
        container: new Callbacks<any>(),
    };

    protected Selectors: any;
    protected _update(): void {
        const PNAnalysisModel = this.data;

        this.containers.calculationState.value = (PNAnalysisModel.isCalculating ? "calculating" : "done")
        this.containers.reachableMarkings.value = PNAnalysisModel.numRechableMarkings + (PNAnalysisModel.isCalculatedAllMarking ? "" : "+");
        this.containers.calculatedMarkingSteps.value = "" + PNAnalysisModel.stepsFromInitialMarkingCalculated;
        this.containers.maxMarking.value = "" + PNAnalysisModel.maxMarking + (PNAnalysisModel.isCalculatedAllMarking ? "" : "?");
    }

    //private models = {
    //    markingModel: typedNull<PNMarkingModel>(),
    //}

    private containers = {
        calculationState: typedNull<PNAnalysisContainer>(),
        reachableMarkings: typedNull<PNAnalysisContainer>(),
        calculatedMarkingSteps: typedNull<PNAnalysisContainer>(),
        maxMarking: typedNull<PNAnalysisContainer>(),
    }

    public setReachabilityTree(markingModel: ReachabilityTree) {
        this.data.tree = markingModel;
        this.update();
    }

    constructor(container: d3BaseSelector) {
        super(container);
        const flex = container.append("div");

        flex
            .style("display", "flex")
            .style("flex-wrap", "wrap");


        [].forEach(x => {
            flex.append("div")
                .text(x);
        })

        const calculationState = this.containers.calculationState = new PNAnalysisContainer(flex);
        calculationState.label = "state";

        const reachableMarkings = this.containers.reachableMarkings = new PNAnalysisContainer(flex);
        reachableMarkings.label = "reachable markings";

        const calculatedMarkingSteps = this.containers.calculatedMarkingSteps = new PNAnalysisContainer(flex);
        calculatedMarkingSteps.label = "calculated steps";

        const maxMarking = this.containers.maxMarking = new PNAnalysisContainer(flex);
        maxMarking.label = "max marking";

        this.data = new PNAnalysisModel();
    }
}

class PNAnalysisContainer {
    private readonly container: d3BaseSelector;
    private selectors = {
        div: typedNull<d3BaseSelector>(),
        label: typedNull<d3BaseSelector>(),
        value: typedNull<d3BaseSelector>(),
    }

    public get label(): string {
        return this.selectors.label.text();
    }
    public set label(lab: string) {
        this.selectors.label.text(lab);
    }

    public get value(): string {
        return this.selectors.value.text();
    }
    public set value(val: string) {
        this.selectors.value.text(val);
    }


    constructor(container: d3BaseSelector) {
        this.container = container;

        const div = this.selectors.div = container.append("div")
            .style("border", "1px solid lightgray")
            .style("margin", "5px")
            .style("text-align", "center")
            ;

        const label = this.selectors.label = div.append("div")
            .style("padding", "5px")
            .text(" ")
            .style("border-bottom", "1px solid lightgray")
            ;

        const value = this.selectors.value = div.append("div")
            .style("padding", "5px")
            .text(" ")
            ;
    }
}