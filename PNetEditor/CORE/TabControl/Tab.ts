import { d3BaseSelector, html } from "../../CORE/Constants";
import { TabGroup } from "./TabGroup";


export class Tab {
    public readonly container: d3BaseSelector;
    public readonly tabButton: d3BaseSelector;
    public readonly parentTabGroup: TabGroup;

    public get label(): string { return this.tabButton.text(); }
    public set label(text: string) { this.tabButton.text(text); }

    /** todo: test */
    public get isVisible() {
        return !this.container.classed("hidden");
    }

    public Hide() {
        this.container.classed("hidden", true);
        this.tabButton.classed(html.classes.controlPanel.tabSelected, false);
    }

    public Show() {
        this.container.classed("hidden", false);
        this.tabButton.classed(html.classes.controlPanel.tabSelected, true);
    }

    private _onKeyDownWhenOpened: (e: TabKeyDownEvent) => void = () => { };
    public AddOnKeyDownWhenOpened(callback: (e: TabKeyDownEvent) => void) {
        const old = this._onKeyDownWhenOpened; this._onKeyDownWhenOpened = (...args) => { old(...args); callback(...args); };
    }

    private _onBeforeRemove: (e:BeforeRemoveEvent)=>void = () => { };
    public AddOnBeforeRemove(callback: (e: BeforeRemoveEvent) => void) {
        const old = this._onBeforeRemove; this._onBeforeRemove = (...args) => { old(...args); callback(...args); };
    }

    public remove() {
        const eventArgs = { cancelClose: false };
        this._onBeforeRemove(eventArgs);
        if (!eventArgs.cancelClose)
            this.parentTabGroup.remove(this);
    }

    constructor(container: d3BaseSelector, tabButton: d3BaseSelector, parentTabGroup: TabGroup) {
        this.container = container;
        this.tabButton = tabButton;

        this.parentTabGroup = parentTabGroup;
        tabButton.classed("button", true);
        tabButton.classed(html.classes.controlPanel.tabButton, true);
        tabButton.classed("no-border", true);

        this.label = "unnamed";

        this.Hide();
    }
}

export type BeforeRemoveEvent = { cancelClose: boolean };
export type TabKeyDownEvent = KeyboardEvent;
