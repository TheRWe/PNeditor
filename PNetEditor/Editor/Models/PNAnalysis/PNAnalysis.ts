import { PNModel } from "../PNet/PNModel";
import { Tab } from "../../../CORE/TabControl/Tab";
import { typedNull } from "../../../Helpers/purify";
import { PNMarkingModel } from "./PNMarkingModel";
import { PNAnalysisDraw } from "./PNAnalysisDraw";
import { ReachabilityGraphDraw } from "./Reachability/Graph/ReachabilityGraphDraw";
import { ReachabilityGraphModel } from "./Reachability/Graph/ReachabilityGraphModel";

export class PNAnalysis{
    private readonly tabs = {
        reachabilityGraph: typedNull<Tab>(),
        pnAnalysis: typedNull<Tab>(),
    };

    private models = {
        pnModel: typedNull<PNModel>(),
        pnMarkingModel: typedNull<PNMarkingModel>(),
        graphModel: typedNull<ReachabilityGraphModel>(),
    }

    private draws = {
        pnAnalysisDraw: typedNull<PNAnalysisDraw>(),
        graphDraw: typedNull<ReachabilityGraphDraw>(),
    }


    public update() {
        this.models.pnMarkingModel.StopCalculations();
        this.models.pnMarkingModel.UpdateModel(this.models.pnModel);
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

        this.models.pnMarkingModel = new PNMarkingModel();

        this.draws.pnAnalysisDraw.setMarkingModel(this.models.pnMarkingModel);

        const graphSvg = graphTab.container.append("svg").style("height", "100%");
        this.draws.graphDraw = new ReachabilityGraphDraw(graphSvg);
        this.draws.graphDraw.data = this.models.graphModel = new ReachabilityGraphModel();

        this.models.pnMarkingModel.AddOnCalculatedNodesForGraph(() => {
            this.models.graphModel.SetMakringModel(this.models.pnMarkingModel);
            this.draws.graphDraw.update();
            this.draws.graphDraw.simulation.alpha(1).restart();

        });

        this.update();
        setTimeout(() => { this.draws.pnAnalysisDraw.update(); });
    }
}