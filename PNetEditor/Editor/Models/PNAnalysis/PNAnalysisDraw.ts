import { DrawBase, Callbacks } from "../../Models/_Basic/DrawBase";
import { PNModel } from "../PNet/PNModel";
import { d3BaseSelector } from "../../Constants";
import { typedNull } from "../../../Helpers/purify";
import { PNMarkingModel } from "./PNMarkingModel";

export class PNAnalysisDraw extends DrawBase<PNModel>{
    public Callbacks = {
        container: new Callbacks<any>(),
    };

    protected Selectors: any;
    protected _update(): void {
        const markingModel = this.models.markingModel;
        if (markingModel) {
            this.containers.reachableMarkings.value = markingModel.numRechableMarkings + (markingModel.isCalculatedAllMarking ? "" : "+");
        } else {
            // todo: hide
        }
    }

    private models = {
        markingModel: typedNull<PNMarkingModel>(),
    }

    private containers = {
        reachableMarkings: typedNull<PNAnalysisContainer>(),
    }

    public setMarkingModel(markingModel: PNMarkingModel) {
        this.models.markingModel = markingModel;
        markingModel.AddOnCalculationChange(() => {
            this.update();
        });
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

        const reachableMarkings = this.containers.reachableMarkings = new PNAnalysisContainer(flex);
        reachableMarkings.label = "reachable markings";
    }


}

class PNAnalysisContainer {
    private readonly container: d3BaseSelector;
    private selectors = {
        div: typedNull<d3BaseSelector>(),
        label: typedNull<d3BaseSelector>(),
        value: typedNull<d3BaseSelector>(),
    }

    public get label(): string{
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