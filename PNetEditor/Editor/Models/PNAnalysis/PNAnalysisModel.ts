import { ModelBase } from "../_Basic/ModelBase";
import { ReachabilityTree } from "./Reachability/ReachabilityTree";
import { numbers } from "../../../CORE/Constants";
import { GraphNode } from "../../../CORE/Graph";


export class PNAnalysisModel extends ModelBase<PNAnalysisModelJSON> {
    public toJSON() {
        throw new Error("Method not implemented.");
    }
    public fromJSON(json: any): boolean {
        throw new Error("Method not implemented.");
    }

    public tree: ReachabilityTree;

    public get containstOmega(): boolean {
        return this.tree.graph.nodes.some(x => x.data.marking.some(y => y.marking === numbers.omega));
    }
    public get isCalculating(): boolean {
        return this.tree.calculatingToDepth;
    };
    public get numStates(): number {
        return this.tree.graph.nodes.length;
    };
    public get stepsFromInitialMarkingCalculated() {
        // todo: implementovat nebo smazat
        return "not implemented";
        //return Math.max(...this.tree.graph.allNodes.map(x => x.depth));
    };
    public get isCalculatedAllMarking(): boolean {
        return this.tree.isAllPossibleNodesCalculated();
    };
    public get maxMarking(): number {
        return Math.max(...this.tree.graph.nodes.map(x => Math.max(...x.data.marking.map(y => y.marking).filter(y => y !== numbers.omega))));
    };

    public get reversible(): boolean {
        const g = this.tree.graph;
        const root = this.tree.root;
        return g.nodes.every(node => g.GetTransitiveFrom(node).some(x => x === root));
    }

    // todo: zkontrolovat že funguje
    public get terminates() {
        const g = this.tree.graph;
        const containsCycle = (node: GraphNode<any>) => {
            // todo: algoritmus hledání smyček v grafu
            try {
                const rec = (n: GraphNode<any>): boolean => {
                    const from = g.GetFrom(n);
                    if (from.some(n => n === node))
                        return true;
                    return from.some(n => rec(n));
                };
                return rec(node);
            } catch{
                return true;
            }
        }
        return g.nodes.every(n => !containsCycle(n));
    }

    public get deadlockFree() {
        const g = this.tree.graph;
        return g.nodes.every(node => g.GetFrom(node).length > 0);
    }
}


type PNAnalysisModelJSON = any;
