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
        return this.tree.allNodes.length;
    };
    public get stepsFromInitialMarkingCalculated(): number {
        return Math.max(...this.tree.allNodes.map(x => x.index));
    };
    public get isCalculatedAllMarking(): boolean {
        return this.tree.isAllPossibleNodesCalculated();
    };
    public get maxMarking(): number {
        return Math.max(...this.tree.allNodes.map(x => Math.max(...x.markings.map(y => y.marking))));
    };
}


type PNAnalysisModelJSON = any;
