import { PNModel } from "../PNet/PNModel";
import { Tab } from "../../../CORE/TabControl/Tab";
import { typedNull } from "../../../Helpers/purify";
import { PNMarkingModel } from "./PNMarkingModel";

export class PNAnalysis{
    private readonly pnmodel: PNModel;
    private readonly tabs = {
        reachabilityGraph: typedNull<Tab>(),
    };

    private pnMarkingModel: PNMarkingModel;

    constructor(tab: Tab, pnmodel: PNModel) {
        this.pnmodel = pnmodel;

        const tabGroup = tab.parentTabGroup;

        const graphTab = this.tabs.reachabilityGraph = tabGroup.parentTabControl.addTab(tabGroup);

        graphTab.AddOnBeforeRemove(() => {
            this.tabs.reachabilityGraph = null;
        });
        graphTab.label = "Reachability";

        this.pnMarkingModel = new PNMarkingModel();
        //this.pnMarkingModel.AddOnCalculationChange(() => { console.debug("graf calc") });

        this.pnMarkingModel.UpdateModel(pnmodel);
        console.debug(this.pnMarkingModel);
    }
}