import { PNModel } from "../PNet/PNModel";
import { Tab } from "../../../CORE/TabControl/Tab";
import { typedNull } from "../../../Helpers/purify";

export class PNAnalysis{
    private readonly pnmodel: PNModel;
    private readonly tabs = {
        reachabilityGraph: typedNull<Tab>(),
    };


    constructor(tab: Tab, pnmodel: PNModel) {
        this.pnmodel = pnmodel;

        const tabGroup = tab.parentTabGroup;

        const graphTab = this.tabs.reachabilityGraph = tabGroup.parentTabControl.addTab(tabGroup);

        graphTab.AddOnBeforeRemove(() => {
            this.tabs.reachabilityGraph = null;
        });
        graphTab.label = "Reachability";
    }
}