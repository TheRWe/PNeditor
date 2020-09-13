import { d3BaseSelector } from "../../CORE/Constants";
import { Tab } from "./Tab";
import { TabGroup } from "./TabGroup";

/** Object to create and control tab component */
export class TabControl {
    public readonly containerLabels: d3BaseSelector;
    public readonly containerContent: d3BaseSelector;

    public TabGroups = [] as TabGroup[];

    /** Creates tab and add it to tab group. If tab group is not defined, creates new tab. */
    public addTab(group: TabGroup = null): Tab {
        if (group == null) {
            const groupLabel = this.containerLabels.append("div");
            const groupContent = this.containerContent.append("div");
            group = new TabGroup(groupLabel, groupContent, this);
            this.TabGroups.push(group);
        }
        const tab = group.AddTab();
        return tab;
    }

    private _selectedTab: Tab;
    /** Currently opened tab */
    public get SelectedTab() { return this._selectedTab; }
    public SelectTab(tab: Tab) {
        this.TabGroups.forEach(g => g.tabs.forEach(t => { t.Hide(); }));
        tab.Show();
        this._selectedTab = tab;
    }

    public RemoveTabGroup(group: TabGroup) {
        const index = this.TabGroups.findIndex(x => x === group);
        if (index == -1) return;

        this.TabGroups.splice(index, 1);
    }

    constructor(containerLabels: d3BaseSelector, containerContent: d3BaseSelector) {
        this.containerLabels = containerLabels;
        this.containerContent = containerContent;
    }
}
