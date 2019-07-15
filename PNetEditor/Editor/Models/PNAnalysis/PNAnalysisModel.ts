import { ModelBase } from "../_Basic/ModelBase";
import { ReachabilityTree } from "./Reachability/ReachabilityTree";


export class PNAnalysisModel extends ModelBase<PNAnalysisModelJSON> {
    public toJSON() {
        throw new Error("Method not implemented.");
    }
    public fromJSON(json: any): boolean {
        throw new Error("Method not implemented.");
    }

    public tree: ReachabilityTree;

    public get isCalculating(): boolean {
        return this.tree.calculatingToDepth;
    };
    public get numRechableMarkings(): number {
        return this.tree.graph.nodes.length;
    };
    public get stepsFromInitialMarkingCalculated() {
        return "not implemented";
        //return Math.max(...this.tree.graph.allNodes.map(x => x.depth));
    };
    public get isCalculatedAllMarking(): boolean {
        return this.tree.isAllPossibleNodesCalculated();
    };
    public get maxMarking(): number {
        return Math.max(...this.tree.graph.nodes.map(x => Math.max(...x.data.marking.map(y => y.marking))));
    };
}


type PNAnalysisModelJSON = any;
