import { ModelBase } from "../../../_Basic/ModelBase";

export class ReachabilityGraphModel extends ModelBase<ReachabilityGraphModelJSON> {
    private _transitions = [] as { from: number, to: number, transitionID: number }[];

    public states: ReachabilityState[] = [];

    public get transitions() {
        return this._transitions.map(x => { return { from: this.states.find(s => s.id == x.from), to: this.states.find(s => s.id == x.to) } })
    }

    public AddTransition(from: number, to: number, transitionID: number) {
        this._transitions.push({ from, to, transitionID });
        if (this.states.findIndex(x => x.id === from) === -1) {
            this.states.push({ id: from, x: undefined, y: undefined});
        }
        if (this.states.findIndex(x => x.id === to) === -1) {
            this.states.push({ id: to, x: undefined, y: undefined });
        }
    }

    public toJSON(): ReachabilityGraphModelJSON {
        return { transitions: this._transitions };
    }
    public fromJSON(json: ReachabilityGraphModelJSON): boolean {
        this._transitions = json.transitions;
        return true;
    }
}

export interface ReachabilityState {
    id: number;
    x: number;
    y: number;
}

type ReachabilityGraphModelJSON = {
    transitions: { from: number, to: number, transitionID: number }[]
}
