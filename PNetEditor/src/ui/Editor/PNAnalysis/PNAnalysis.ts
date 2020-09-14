import { PNModel } from "../PNet/PNModel";
import { Tab } from "../../components/TabControl/Tab";
import { sleep } from "../../../CORE/Helpers/purify";
import { PNAnalysisDraw } from "./PNAnalysisDraw";
import { d3BaseSelector } from "../../../definitions/Constants";

export class PNAnalysis {
    public readonly models = {
        pnModel: null as PNModel,
    };

    private draws = {
        pnAnalysisDraw: null as PNAnalysisDraw,
    };

    private Selectors = {
        analysisContainer: null as d3BaseSelector,
    };

    private skipPreviousCalc = () => { };
    public update() {
        const self = this;
        (async function () {
            self.skipPreviousCalc();
            self.draws.pnAnalysisDraw.Clear();
            let calculating = true;
            let endCalc = () => { };
            self.draws.pnAnalysisDraw.setPnet(self.models.pnModel.toJSON());

            const maxSameGraphSizeTimes = 30;
            let LastGraphSize = Number.MAX_SAFE_INTEGER;
            let sameGraphSizeTimes = 0;
            async function calculate() {
                await sleep(100);
                const g = self.draws.pnAnalysisDraw.Models.CoverabilityGraph;
                const pefm = performance.now();
                await g.CalculateHashed();
                console.info(`calculated time: ${performance.now() - pefm}`);
                self.draws.pnAnalysisDraw.update();

                if (LastGraphSize > g.numStates) {
                    sameGraphSizeTimes = 0;
                    LastGraphSize = g.numStates;
                } else {
                    sameGraphSizeTimes++;
                }

                if (sameGraphSizeTimes > maxSameGraphSizeTimes) {
                    endCalc();
                } else if (calculating && g.containstOmega) {
                    calculate();
                }
            }
            const net = self.draws.pnAnalysisDraw.Models.CoverabilityGraph.net;
            if (net.places.length > 0 && net.transitions.length > 0)
                calculate();

            await new Promise(r => { endCalc = r; self.skipPreviousCalc = r; setTimeout(r, 60_000); });

            console.debug(self);

            console.debug("end calc");
            calculating = false;
        })();
    }

    constructor(containers: { analysisContainer: d3BaseSelector }, pnmodel: PNModel) {
        this.models.pnModel = pnmodel;

        const analysisContainer = this.Selectors.analysisContainer = containers.analysisContainer;
        this.draws.pnAnalysisDraw = new PNAnalysisDraw(analysisContainer);

        this.update();
    }
}