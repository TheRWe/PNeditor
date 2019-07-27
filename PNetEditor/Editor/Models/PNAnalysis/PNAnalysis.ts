import { PNModel } from "../PNet/PNModel";
import { Tab } from "../../../CORE/TabControl/Tab";
import { typedNull } from "../../../Helpers/purify";
import { PNAnalysisDraw } from "./PNAnalysisDraw";
import { CoverabilityGraph, ReachabilitySettings } from "./Reachability/ReachabilityTree";
import { d3BaseSelector } from "../../../CORE/Constants";

export class PNAnalysis {
    public readonly models = {
        pnModel: typedNull<PNModel>(),
    };

    private draws = {
        pnAnalysisDraw: typedNull<PNAnalysisDraw>(),
    };

    private Selectors = {
        analysisContainer: null as d3BaseSelector,
    };

    public update() {
        const self = this;
        (async function () {
            let calculating = true;
            self.draws.pnAnalysisDraw.setPnet(self.models.pnModel.toJSON());

            function raf() {
                self.draws.pnAnalysisDraw.update();

                if (calculating) {
                    requestAnimationFrame(raf);
                }
            }
            raf();

            async function calculate() {
                await self.draws.pnAnalysisDraw.models.CoverabilityGraph.Calculate();

                if (calculating) {
                    calculate();
                }
            }
            const net = self.draws.pnAnalysisDraw.models.CoverabilityGraph.net;
            if (net.places.length > 0 && net.transitions.length > 0)
                calculate();


            // todo: do nastavení
            await new Promise(r => setTimeout(r, 10000));

            console.debug(self);

            console.debug("end calc");
            calculating = false;
        })();
    }

    public close() {
    }

    constructor(containers: { analysisContainer: d3BaseSelector }, pnmodel: PNModel) {
        this.models.pnModel = pnmodel;

        const analysisContainer = this.Selectors.analysisContainer = containers.analysisContainer;
        this.draws.pnAnalysisDraw = new PNAnalysisDraw(analysisContainer);

        this.update();
    }
}