import { ActionBase } from "../_Basic/ActionBase";
import { PNModel, JSONNet, Place, Arc, Transition } from "./PNModel";
import { Position } from "./../../Constants";

export type SelectedElementsPNet = { transitions?: Transition[], places?: Place[] };

export class PNAction extends ActionBase<PNModel>{

    //#region History

    private netHistory: JSONNet[] = [];
    private netHistoryIndex = -1;

    public AddHist() {
        this.netHistoryIndex++;
        this.netHistory[this.netHistoryIndex] = this.model.toJSON();
        this.netHistory = this.netHistory.slice(0, this.netHistoryIndex + 1);
    }

    private setHistory() {
        console.debug({ netHistory: this.netHistory, settingHistoryIndex: this.netHistoryIndex });
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

    public AddArc(t: Transition, p: Place, toPlace: number, toTransition: number): Arc {
        const arc = new Arc(t, p, toPlace, toTransition);
        this.model.arcs.push(arc);
        this.CallOnModelChange();
        return arc;
    }

    public AddTransition(pos: Position): Transition {
        const transition = new Transition(pos);
        this.model.transitions.push(transition);
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
        this.model.getArcesOfTransition(transition).forEach(a => { a.place.marking += a.toPlace - a.toTransition; });
        this.CallOnModelChange();
        return true;
    }

    constructor(model: PNModel) {
        super(model);

        this.AddOnModelChange((model) => {
            this.AddHist();
        });
    }
}
