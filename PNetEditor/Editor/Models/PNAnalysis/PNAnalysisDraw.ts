import { DrawBase, Callbacks } from "../../Models/_Basic/DrawBase";
import { PNModel } from "../PNet/PNModel";
import { range } from "d3";
import { d3BaseSelector } from "../../Constants";

export class PNAnalysisDraw extends DrawBase<PNModel>{
    public Callbacks = {
        container: new Callbacks<any>(),
    };

    protected Selectors: any;
    protected _update(): void {

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

    }


}