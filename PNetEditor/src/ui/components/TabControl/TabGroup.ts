import { d3BaseSelector } from "../../../definitions/Constants";
import { TabControl } from "./TabControl";
import { Tab } from "./Tab";


export class TabGroup{
  public readonly containerLabel: d3BaseSelector;
  public readonly containerGroupContent: d3BaseSelector;
  public readonly parentTabControl: TabControl;
  public tabs: Tab[] = [];

  public remove(tab: Tab) {
    const index = this.tabs.findIndex(x => x === tab);
    if (index === -1) return;

    tab.tabButton.remove();
    tab.container.remove();
    this.tabs.splice(index, 1);
    if (this.tabs.length === 0) {
      this.parentTabControl.RemoveTabGroup(this);
      this.containerGroupContent.remove();
      this.containerLabel.remove();
    }
  }

  public AddTab() {
    const tabContainer = this.containerGroupContent.append("div");
    const tabButton = this.containerLabel.append("div");

    const tab: Tab = new Tab(tabContainer, tabButton, this);
    const tabControl = this.parentTabControl;
    tab.tabButton.on("click", () => { tabControl.SelectTab(tab); });

    this.tabs.push(tab);
    return tab;
  }

  constructor(containerLabel: d3BaseSelector, containerGroupContent: d3BaseSelector, parentTabControl: TabControl) {
    this.containerLabel = containerLabel;
    this.containerGroupContent = containerGroupContent;
    this.parentTabControl = parentTabControl;

    containerLabel.classed("control-panel-tab", true);
  }
}
