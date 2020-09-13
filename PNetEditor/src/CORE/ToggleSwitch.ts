import { d3BaseSelector, html } from "./Constants";

export enum ToggleSwitchState { on = "on", off = "off", hidden = "hidden" }

/** Class that creates button that switches two states. */
export class ToggleSwitch {
    public selectors = {
        label: null as d3BaseSelector,
        input: null as d3BaseSelector,
        labelOn: null as d3BaseSelector,
        labelOff: null as d3BaseSelector,
    }

    private _state: ToggleSwitchState;
    public get State(): ToggleSwitchState {
        return this._state;
    }
    public set State(state: ToggleSwitchState) {
        this._changeState(state);
        this.ToggleChanged();
    }

    public set StateSuppressed(state: ToggleSwitchState) {
        this._changeState(state);
    }

    private _changeState(state: ToggleSwitchState) {
        if (this._state === state)
            return;

        this._state = state;
        if (state === ToggleSwitchState.hidden) {
            this.selectors.label.style("display", "none");
        }
        else {
            this.selectors.label.style("display", "inline-block");

            this.selectors.input.property("checked", state === ToggleSwitchState.on);
        }
    }

    private _toggleChangedHandler = (obj: ToggleSwitch) => { };
    public AddOnToggleChange(handler: (obj: ToggleSwitch) => void): void {
        const prevHandler = this._toggleChangedHandler;
        this._toggleChangedHandler = (obj: ToggleSwitch) => {
            prevHandler(obj);
            handler(obj);
        }
    }

    private ToggleChanged() {
        this._toggleChangedHandler(this);
    }

    constructor(containerSelector: d3BaseSelector, textOn: string, textOff: string) {
        const label = this.selectors.label = containerSelector.append("label")
            .classed(html.classes.ToggleSwitch.switcher, true)
            .classed("button", true)
            ;
        const input = this.selectors.input = label.append("input")
            .attr("type", "checkbox")
            .property("checked", false)
            .on("change", () => {
                this.State = this.selectors.input.property("checked") === true ? ToggleSwitchState.on : ToggleSwitchState.off;
            })
            ;
        const labelOff = this.selectors.labelOff = label.append("span")
            .classed(html.classes.ToggleSwitch.labelOff, true)
            .text(textOff)
            ;

        const labelOn = this.selectors.labelOn = label.append("span")
            .classed(html.classes.ToggleSwitch.labelOn, true)
            .text(textOn)
            ;


        this.State = ToggleSwitchState.off;
    }
}