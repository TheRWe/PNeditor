﻿import { PNModel } from "../PNet/PNModel";
import { Tab } from "../../../CORE/TabControl/Tab";
import { typedNull } from "../../../Helpers/purify";
import { PNAnalysisDraw } from "./PNAnalysisDraw";
import { ReachabilityTree, ReachabilitySettings } from "./Reachability/ReachabilityTree";
import { d3BaseSelector } from "../../../CORE/Constants";

export class PNAnalysis {
    public readonly models = {
        pnModel: typedNull<PNModel>(),
        reachabilityTree: typedNull<ReachabilityTree>(),
    };

    private draws = {
        pnAnalysisDraw: typedNull<PNAnalysisDraw>(),
    };

    private Selectors = {
        analysisContainer: null as d3BaseSelector,
    };

    public update() {
        if (this.models.reachabilityTree)
            this.models.reachabilityTree.calculatingToDepth = false;

        this.draws.pnAnalysisDraw.models.pnanalysisModel.tree = this.models.reachabilityTree = new ReachabilityTree(this.models.pnModel.toJSON());

        const self = this;
        (async function () {
            let calculating = true;

            let graphCalc = false;


            function raf() {
                self.draws.pnAnalysisDraw.update();

                // todo: vykrslování marking grafu

                if (calculating) {
                    requestAnimationFrame(raf);
                }
            }
            raf();

            await self.models.reachabilityTree.calculateToDepth(ReachabilitySettings.defaultCalculationDepth);


            console.debug(self);

            console.debug("end calc");
            calculating = false;
        })();
    }

    public close() {
        this.models.reachabilityTree.calculatingToDepth = false;
    }

    constructor(containers: { analysisContainer: d3BaseSelector }, pnmodel: PNModel) {
        this.models.pnModel = pnmodel;

        const analysisContainer = this.Selectors.analysisContainer = containers.analysisContainer;
        this.draws.pnAnalysisDraw = new PNAnalysisDraw(analysisContainer);

        this.update();
    }
}