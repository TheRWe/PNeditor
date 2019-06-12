import { d3BaseNoDataSelector, d3BaseSelector } from "../../_Editor/Constants";
import { TabGroup } from "./TabGroup";


export class Tab {
    public readonly container: d3BaseSelector;
    public readonly tabButton: d3BaseSelector;
    public readonly parentTabGroup: TabGroup;

    public get label(): string { return this.tabButton.text(); }
    public set label(text: string) { this.tabButton.text(text); }


    public Hide() {
        this.container.classed("hidden", true);
        this.tabButton.classed("control-panel-tab-sub-selected", false);
    }

    public Show() {
        this.container.classed("hidden", false);
        this.tabButton.classed("control-panel-tab-sub-selected", true);
    }

    private onBeforeRemove: (event: { cancelClose: boolean }) => void = () => { };
    public addOnBeforeRemove(callback: (event: { cancelClose: boolean }) => void) {
        const old = this.onBeforeRemove; this.onBeforeRemove = (...args) => { old(...args); callback(...args); };
    }

    public remove() {
        const eventArgs = { cancelClose: false };
        this.onBeforeRemove(eventArgs);
        if (!eventArgs.cancelClose)
            this.parentTabGroup.remove(this);
    }

    constructor(container: d3BaseSelector, tabButton: d3BaseSelector, parentTabGroup: TabGroup) {
        this.container = container;
        this.tabButton = tabButton;

        this.parentTabGroup = parentTabGroup;
        tabButton.classed("button", true);
        tabButton.classed("control-panel-tab-sub", true);
        tabButton.classed("no-border", true);

        this.label = "unnamed";

        this.Hide();
    }
}
