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

        // todo: calculating zobrazit
        //this.containers.calculationState.value = (PNAnalysisModel.isCalculating ? "calculating" : "done")

        //todo: počet stavů bude při výpočtu zobrazen s +
        this.containers.states.value = PNAnalysisModel.numStates + "" //+ (PNAnalysisModel.isCalculatedAllMarking ? "" : "+");
        this.containers.bounded.value = PNAnalysisModel.containstOmega ? "No" : "" + PNAnalysisModel.maxMarking + (PNAnalysisModel.isCalculatedAllMarking ? "" : "?");
        this.containers.containsOmega.value = PNAnalysisModel.containstOmega ? "Yes" : "No" + (PNAnalysisModel.isCalculatedAllMarking ? "" : "?");

        this.containers.reversible.value = PNAnalysisModel.reversible ? "Yes" : "No";
        this.containers.terminates.value = PNAnalysisModel.terminates ? "Yes" : "No";
        this.containers.deadlockFree.value = PNAnalysisModel.deadlockFree ? "Yes" : "No";
    }

    //private models = {
    //    markingModel: typedNull<PNMarkingModel>(),
    //}

    private containers = {
        states: typedNull<PNAnalysisContainer>(),
        bounded: typedNull<PNAnalysisContainer>(),

        containsOmega: typedNull<PNAnalysisContainer>(),
        reversible: typedNull<PNAnalysisContainer>(),
        terminates: typedNull<PNAnalysisContainer>(),
        deadlockFree: typedNull<PNAnalysisContainer>(),
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

        const reachableMarkings = this.containers.states = new PNAnalysisContainer(flex);
        reachableMarkings.label = "states";

        (this.containers.bounded = new PNAnalysisContainer(flex)).label = "bounded";
        (this.containers.containsOmega = new PNAnalysisContainer(flex)).label = "Contains ω marking";

        (this.containers.reversible = new PNAnalysisContainer(flex)).label = "reversible";
        (this.containers.terminates = new PNAnalysisContainer(flex)).label = "terminates";
        (this.containers.deadlockFree = new PNAnalysisContainer(flex)).label = "deadlock-free";

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