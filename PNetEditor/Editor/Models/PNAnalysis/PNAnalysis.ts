import { PNModel } from "../PNet/PNModel";
import { Tab } from "../../../CORE/TabControl/Tab";
import { typedNull } from "../../../Helpers/purify";
import { PNMarkingModel } from "./PNMarkingModel";
import { PNAnalysisDraw } from "./PNAnalysisDraw";
import { TabGroup } from "../../../CORE/TabControl/TabGroup";

export class PNAnalysis{
    private readonly pnmodel: PNModel;
    private readonly tabs = {
        reachabilityGraph: typedNull<Tab>(),
        pnAnalysis: typedNull<Tab>(),
    };

    private pnMarkingModel: PNMarkingModel;


    private pnAnalysisDraw: PNAnalysisDraw;

    constructor(tab: Tab, pnmodel: PNModel) {
        this.pnmodel = pnmodel;

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


        this.pnMarkingModel = new PNMarkingModel();
        //this.pnMarkingModel.AddOnCalculationChange(() => { console.debug("graf calc") });

        this.pnMarkingModel.UpdateModel(pnmodel);

        this.pnAnalysisDraw.setMarkingModel(this.pnMarkingModel);

        console.debug(this.pnMarkingModel);
    }
}