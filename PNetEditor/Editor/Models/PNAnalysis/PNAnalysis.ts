import { PNModel } from "../PNet/PNModel";
import { Tab } from "../../../CORE/TabControl/Tab";
import { typedNull } from "../../../Helpers/purify";
import { PNAnalysisDraw } from "./PNAnalysisDraw";
import { ReachabilityGraphDraw } from "./Reachability/Graph/ReachabilityGraphDraw";
import { ReachabilityGraphModel } from "./Reachability/Graph/ReachabilityGraphModel";
import { ReachabilityTree, ReachabilitySettings } from "./Reachability/ReachabilityTree";

export class PNAnalysis {
    private readonly tabs = {
        reachabilityGraph: typedNull<Tab>(),
        pnAnalysis: typedNull<Tab>(),
    };

    private models = {
        pnModel: typedNull<PNModel>(),
        reachabilityTree: typedNull<ReachabilityTree>(),
    }

    private draws = {
        pnAnalysisDraw: typedNull<PNAnalysisDraw>(),
        graphDraw: typedNull<ReachabilityGraphDraw>(),
    }


    public update() {
        if (this.models.reachabilityTree)
            this.models.reachabilityTree.calculatingToDepth = false;

        this.draws.pnAnalysisDraw.data.tree = this.models.reachabilityTree = new ReachabilityTree(this.models.pnModel.toJSON());
        this.draws.graphDraw.data = new ReachabilityGraphModel(this.models.reachabilityTree);

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
        const tabs = this.tabs;

        const analysisTab = tabs.pnAnalysis;
        if (analysisTab) {
            analysisTab.remove();
            tabs.pnAnalysis = null;
        }

        const reachabilityGraphTab = tabs.reachabilityGraph;
        if (reachabilityGraphTab) {
            reachabilityGraphTab.remove();
            tabs.reachabilityGraph = null;
        }

        this.models.reachabilityTree.calculatingToDepth = false;
    }

    constructor(tab: Tab, pnmodel: PNModel) {
        this.models.pnModel = pnmodel;

        const tabGroup = tab.parentTabGroup;

        const graphTab = this.tabs.reachabilityGraph = tabGroup.parentTabControl.addTab(tabGroup);
        graphTab.AddOnBeforeRemove(() => {
            this.tabs.reachabilityGraph = null;
        });
        graphTab.label = "Reachability";
        graphTab.container.style("height", "99vh")
            .style("display", "flex")
            .style("flex-direction", "column");

        const pnAnalysisTab = this.tabs.pnAnalysis = tabGroup.parentTabControl.addTab(tabGroup);
        pnAnalysisTab.AddOnBeforeRemove(() => {
            this.tabs.pnAnalysis = null;
        })
        pnAnalysisTab.label = "analysis";
        this.draws.pnAnalysisDraw = new PNAnalysisDraw(pnAnalysisTab.container);

        const graphSvg = graphTab.container.append("svg").style("height", "100%");
        this.draws.graphDraw = new ReachabilityGraphDraw(graphSvg);

        this.update();
    }
}