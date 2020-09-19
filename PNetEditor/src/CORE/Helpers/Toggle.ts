import { d3BaseSelector } from "../../definitions/Constants";

export enum ToggleState { on = "on", off = "off", hidden = "hidden" }

export class Toggle {
  private _state: ToggleState;
  public get State(): ToggleState {
    return this._state;
  }
  public set State(state: ToggleState) {
    this._changeState(state);
    this.ToggleChanged();
  }

  public set StateSuppressed(state: ToggleState) {
    this._changeState(state);
  }

  private _changeState(state: ToggleState) {
    if (this._state === state)
      return;

    this._state = state;
    if (state === ToggleState.hidden) {
      this.baseSelector.style("display", "none");
    }
    else {
      this.baseSelector.style("display", "inline-block");
      if (state === ToggleState.on) {
        this.checkboxSelector.property("checked", true);
      }
      else if (state === ToggleState.off) {
        this.checkboxSelector.property("checked", false);
      }
    }
  }

  private _toggleChangedHandler = (obj: Toggle) => { };
  public AddOnToggleChange(handler: (obj: Toggle) => void): void {
    const prevHandler = this._toggleChangedHandler;
    this._toggleChangedHandler = (obj: Toggle) => {
      prevHandler(obj);
      handler(obj);
    };
  }

  private ToggleChanged() {
    this._toggleChangedHandler(this);
  }

  private readonly baseSelector: d3BaseSelector;
  private readonly checkboxSelector: d3BaseSelector;
  public readonly name: string;

  constructor(containerSelector: d3BaseSelector, name: string) {
    this.name = name;

    const baseSelector = this.baseSelector = containerSelector
      .append("div")
      .style("display", "inline-block");

    this._state = ToggleState.off;

    this.checkboxSelector = baseSelector
      .append("input")
      .attr("type", "checkbox")
      .on("change", () => {
        this.State = this.checkboxSelector.property("checked") === true ? ToggleState.on : ToggleState.off;
      })
      .property("checked", false);

    baseSelector
      .append("text")
      .text(this.name);
    this.State = ToggleState.off;
  }
}