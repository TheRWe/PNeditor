import { ModelBase } from "../../../_Basic/ModelBase";
import { ReachabilityTree } from "../ReachabilityTree";

// todo: implementovat 
export class ReachabilityGraphModel extends ModelBase<ReachabilityGraphModelJSON> {
    private _transitions = [] as { source: number, target: number, transitionID: number }[];

    public states: ReachabilityState[] = [];
    private _treeModel: ReachabilityTree;
    public set treeModel(val) {
        this.states = [];
        this._transitions = [];
        this._treeModel = val;
    }
    public get treeModel() {
        return this._treeModel;
    }

    public get transitions() {
        return this._transitions.map(x => { return { from: this.states.find(s => s.id == x.source), to: this.states.find(s => s.id == x.target) } })
    }

    /** show nodes from given state */
    public async ExpandState(stateIndex: number) {
        /*
        const indx = this.treeModel.allNodes.findIndex(x => x.id === stateIndex);
        if (indx === -1) return;
        const state = this.treeModel.allNodes[indx];
        (await state.reachableMarkings()).forEach(x => this.AddTransition(stateIndex, x.node.id, x.transitionID));
        */
    }

    private AddTransition(source: number, target: number, transitionID: number) {
        /*
        this._transitions.push({ source, target, transitionID });
        if (this.states.findIndex(x => x.id === source) === -1) {
            const { id, depth } = this.treeModel.allNodes.find(x => x.id === source);
            this.states.push({ id, x: undefined, y: undefined, depth });
        }
        if (this.states.findIndex(x => x.id === target) === -1) {
            const { id, depth } = this.treeModel.allNodes.find(x => x.id === target);
            this.states.push({ id, x: undefined, y: undefined, depth });
        }
         */
    }

    constructor(tree: ReachabilityTree) {
        super();
        this.treeModel = tree;
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
    depth: number;
    x: number;
    y: number;
}

export type ReachabilityGraphsTransition = { source: number, target: number, transitionID: number };
type ReachabilityGraphModelJSON = {
    transitions: ReachabilityGraphsTransition[]
}
