import { PNModel } from "../PNet/PNModel";
import { Tab } from "../../../CORE/TabControl/Tab";
import { typedNull } from "../../../Helpers/purify";
import { PNMarkingModel } from "./PNMarkingModel";
import { PNAnalysisDraw } from "./PNAnalysisDraw";

export class PNAnalysis{
    private readonly tabs = {
        reachabilityGraph: typedNull<Tab>(),
        pnAnalysis: typedNull<Tab>(),
    };

    private models = {
        pnModel: typedNull<PNModel>(),
        pnMarkingModel: typedNull<PNMarkingModel>(),
    }

    private pnAnalysisDraw: PNAnalysisDraw;

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


        const pnAnalysisTab = this.tabs.pnAnalysis = tabGroup.parentTabControl.addTab(tabGroup);
        pnAnalysisTab.AddOnBeforeRemove(() => {
            this.tabs.pnAnalysis = null;
        })
        pnAnalysisTab.label = "analysis";
        this.pnAnalysisDraw = new PNAnalysisDraw(pnAnalysisTab.container);

        this.models.pnMarkingModel = new PNMarkingModel();

        this.pnAnalysisDraw.setMarkingModel(this.models.pnMarkingModel);

        this.update();
        setTimeout(() => { this.pnAnalysisDraw.update(); });
    }
}