import { ModelBase } from "../../../_Basic/ModelBase";
import { ReachabilityTree } from "../ReachabilityTree";
import { GraphNode } from "../../../../../CORE/Graph";

// todo: implementovat 
export class ReachabilityGraphModel extends ModelBase<any/*ReachabilityGraphModelJSON*/> {
    private _transitions = [] as { source: GraphNode<any>, target: GraphNode<any>, transitionID: number }[];

    public states: { x: number, y: number, node: GraphNode<any> }[] = [];
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
        return this._transitions.map(x => { return { from: this.states.find(s => s.node == x.source), to: this.states.find(s => s.node == x.target) } })
    }

    /** show nodes from given state */
    public async ExpandState(stateIndex: GraphNode<any>) {
        /*
        const indx = this.treeModel.graph.nodes.findIndex(x => x.id === stateIndex);
        if (indx === -1) return;
        const state = this.treeModel.allNodes[indx];
        (await state.reachableMarkings()).forEach(x => this.AddTransition(stateIndex, x.node.id, x.transitionID));
        */
    }

    private AddTransition(source: GraphNode<any>, target: GraphNode<any>, transitionID: number) {
        this._transitions.push({ source, target, transitionID });
        if (this.states.findIndex(x => x.node === source) === -1) {
            this.states.push({ x: undefined, y: undefined, node:source });
        }
        if (this.states.findIndex(x => x.node === target) === -1) {
            this.states.push({ x: undefined, y: undefined, node: target });
        }
    }

    constructor(tree: ReachabilityTree) {
        super();
        this.treeModel = tree;
    }

    public toJSON(): any/*ReachabilityGraphModelJSON */{
        return {}//{ transitions: this._transitions };
    }
    public fromJSON(json: ReachabilityGraphModelJSON): boolean {
        //this._transitions = json.transitions;
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
