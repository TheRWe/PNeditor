import { ActionBase } from "../_Basic/ActionBase";
import { PNetModel, JSONNet, Place, Arc, Transition } from "./PNetModel";
import { Position } from "./../../Constants";

export type SelectedElementsPNet = { transitions?: Transition[], places?: Place[] };

export class PNetAction extends ActionBase<PNetModel>{


    //#region MultipleSelection

    public get Selected(): SelectedElementsPNet {
        return { transitions: [...this.selected.transitions], places: [...this.selected.places] }
    }
    private selected: SelectedElementsPNet = {};


    public Select(transition: Transition): void;
    public Select(place: Place): void;
    public Select(obj: Transition | Place) {
        if (!obj)
            return;
        if (obj instanceof Transition) {
            if (!this.selected.transitions) {
                this.selected.transitions = [obj];
                this.CallOnSelectionChange();
            } else if (this.selected.transitions.indexOf(obj) < 0) {
                this.selected.transitions.push(obj);
                this.CallOnSelectionChange();
            }
        } else if (obj instanceof Place) {
            if (!this.selected.places) {
                this.selected.places = [obj];
                this.CallOnSelectionChange();
            } else if (this.selected.places.indexOf(obj) < 0) {
                this.selected.places.push(obj);
                this.CallOnSelectionChange();
            }
        } else {
            throw new Error("Cannot select object of this type");
        }
    }

    public Deselect(transition: Transition): void;
    public Deselect(place: Place): void;
    public Deselect(obj: Transition | Place) {
        if (!obj)
            return;
        if (obj instanceof Transition) {
            if (this.selected.transitions && this.selected.transitions.indexOf(obj) >= 0) {
                this.selected.transitions.splice(this.selected.transitions.indexOf(obj), 1);
                this.CallOnSelectionChange();
            }
        } else if (obj instanceof Place) {
            if (this.selected.places && this.selected.places.indexOf(obj) >= 0) {
                this.selected.places.splice(this.selected.places.indexOf(obj), 1);
                this.CallOnSelectionChange();
            }
        } else {
            throw new Error("Cannot select object of this type");
        }
    }

    public DeselectAll() {
        this.selected = {};
        this.CallOnSelectionChange();
    }

    public AddOnSelectionChange(callback: (selected: SelectedElementsPNet) => void): void {
        const old = this.onSelectionChange;
        this.onSelectionChange = (...args) => { old(...args); callback(...args); }
    }
    protected onSelectionChange = (selected: SelectedElementsPNet) => { };
    protected CallOnSelectionChange() {
        this.onSelectionChange(this.Selected);
    }

    //#endregion


    //#region History

    private netHistory: JSONNet[] = [];
    private netHistoryIndex = -1;

    public AddHist() {
        this.netHistoryIndex++;
        this.netHistory[this.netHistoryIndex] = this.model.toJSON();
        this.netHistory = this.netHistory.slice(0, this.netHistoryIndex + 1);
    }

    private setHistory() {
        console.debug({ a: this.netHistory, i: this.netHistoryIndex });
        this.model.fromJSON(this.netHistory[this.netHistoryIndex]);
    }

    public Redo() {
        if (!(this.netHistoryIndex + 1 < this.netHistory.length))
            return;
        this.netHistoryIndex++;
        this.setHistory();
    }

    public Undo() {
        if (this.netHistoryIndex <= 0)
            return;
        this.netHistoryIndex--;
        this.setHistory();
    }

    //#endregion


    //#region Edit Modifications

    public AddPlace(pos: Position, name: string = null): Place {
        const place = new Place(name, pos);
        this.model.places.push(place);
        this.CallOnModelChange();
        return place;
    }

    public AddArc(t: Transition, p: Place, qty: number): Arc {
        const arc = new Arc(t, p, qty);
        this.model.arcs.push(arc);
        this.CallOnModelChange();
        return arc;
    }

    public AddTransition(pos: Position): Transition {
        const transition = new Transition(pos);
        this.model.transitions.push();
        this.CallOnModelChange();
        return transition;
    }

    public RemovePlace(place: Place) {
        // ensure remove arc containing this place
        this.CallOnModelChange();
        throw new Error("not implemented");
    }

    public RemoveTransition(transition: Transition) {
        // ensure remove arc containing this transition
        this.CallOnModelChange();
        throw new Error("not implemented");
    }

    public RemoveArc(arc: Arc) {
        this.CallOnModelChange();
        throw new Error("not implemented");
    }

    //#endregion


    //#region Running methods

    public ClearMarkings() {
        this.model.places.forEach(p => { p.marking = 0; });
    }

    public RunTransition(transition: Transition): boolean {
        if (!this.model.IsTransitionEnabled(transition))
            return false;
        this.model.getArcesOfTransition(transition).forEach(a => { a.place.marking += a.qty });
        this.CallOnModelChange();
        return true;
    }

    constructor(model: PNetModel) {
        super(model);

        const self = this;
        this.AddOnModelChange((model) => {
            this.AddHist();
        });
    }
}
