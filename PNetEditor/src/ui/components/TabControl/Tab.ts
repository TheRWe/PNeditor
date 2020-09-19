import { d3BaseSelector, html } from "../../../definitions/Constants";
import { TabGroup } from "./TabGroup";

/** Tab of tabcontrol */
export class Tab {
  public readonly container: d3BaseSelector;
  public readonly tabButton: d3BaseSelector;
  public readonly parentTabGroup: TabGroup;

  /** Label of tab. */
  public get label(): string { return this.tabButton.text(); }
  public set label(text: string) { this.tabButton.text(text); }

  public get isVisible() {
    return !this.container.classed("hidden");
  }

  /** Hide this tab */
  public Hide() {
    this.container.classed("hidden", true);
    this.tabButton.classed(html.classes.controlPanel.tabSelected, false);
  }

  /** Shows this tab */
  public Show() {
    this.container.classed("hidden", false);
    this.tabButton.classed(html.classes.controlPanel.tabSelected, true);
  }

  private _onKeyDownWhenOpened: (e: TabKeyDownEvent) => void = () => { };
  /** Called when is key pressed. */
  public AddOnKeyDownWhenOpened(callback: (e: TabKeyDownEvent) => void) {
    const old = this._onKeyDownWhenOpened; this._onKeyDownWhenOpened = (...args) => { old(...args); callback(...args); };
  }

  private _onBeforeRemove: (e: BeforeRemoveEvent) => void = () => { };
  /** Called before removing this tab. */
  public AddOnBeforeRemove(callback: (e: BeforeRemoveEvent) => void) {
    const old = this._onBeforeRemove; this._onBeforeRemove = (...args) => { old(...args); callback(...args); };
  }

  /** Removes this tab from tab component. Can be canceled when setting cancelClose to true on onBeforeRemove. */
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
