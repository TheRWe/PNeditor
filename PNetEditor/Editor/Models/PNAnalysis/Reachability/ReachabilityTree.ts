import { JSONNet } from "../../PNet/PNModel";
import { GetStringHash, HashSet } from "../../../../CORE/HashSet";

export const ReachabilitySettings = {
    defaultCalculationDepth: 100,
    MaxMarking: 999,
    GraphDepthDefault: 15,
    automaticalyStopCalculationAfterSeconds: 60,
}

// todo: jako model
export class ReachabilityTree {
    public readonly net: JSONNet;

    public readonly root: ReachabilityNode;

    private static getMarkingHash(mark: placeMarking[]): number {
        return GetStringHash(JSON.stringify(mark.slice().sort()));
    }

    public readonly allNodes: ReachabilityNode[] = [];
    private readonly hashSetNodes: HashSet<ReachabilityNode>;

    private cacheIsAllPossibleNodesCalculated: "false" | "true" | "" = "";
    public isAllPossibleNodesCalculated() {
        if (this.cacheIsAllPossibleNodesCalculated === "") {
            for (const node of this.allNodes) {
                if (!node.isReachableMarkingsCalculated) {
                    this.cacheIsAllPossibleNodesCalculated = "false";
                    break;
                }
            }

            if (this.cacheIsAllPossibleNodesCalculated === "")
                this.cacheIsAllPossibleNodesCalculated = "true";
        }

        return this.cacheIsAllPossibleNodesCalculated === "true";
    }

    private idGen = 0;
    public async calculateReachableMarkingsForNode(node: ReachabilityNode): Promise<void> {
        if ((node as any)._reachableMarkings)
            return;

        const reachableMarkings: ReachableMarkings = [];

        await Promise.all(
            this.net.transitions.map(t => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        const newMark: placeMarking[] = node.markings.map(p => {
                            const arc = this.net.arcs.find(a => a.place_id === p.id && a.transition_id === t.id);
                            if (arc === undefined)
                                return { id: p.id, marking: p.marking };
                            else {
                                const marking = p.marking + (arc.toPlace || 0) - (arc.toTransition || 0);
                                return { id: p.id, marking };
                            }
                        });

                        if (newMark.findIndex(x => x.marking > ReachabilitySettings.MaxMarking) >= 0 || newMark.findIndex(x => x.marking < 0) >= 0) {
                            resolve();
                            return;
                        }

                        const hash = ReachabilityTree.getMarkingHash(newMark);
                        const newMarkingNode = new ReachabilityNode(this, hash, newMark, node.depth + 1, ++this.idGen);

                        if (this.hashSetNodes.add(newMarkingNode)) {
                            this.allNodes.push(newMarkingNode);
                            reachableMarkings.push({ node: newMarkingNode, transitionID: t.id });
                        } else {
                            const existingNode = this.allNodes.find(x => x.compareTo(newMarkingNode));
                            reachableMarkings.push({ node: existingNode, transitionID: t.id });
                        }

                        resolve();
                    });
                });
            }));
        (node as any)._reachableMarkings = reachableMarkings;

        this.cacheIsAllPossibleNodesCalculated = "";
    }

    public calculatingToDepth = false;
    public async calculateToDepth(depth: number) {
        this.calculatingToDepth = true;

        const hash: HashSet<ReachabilityNode> = new HashSet<ReachabilityNode>(
            (x) => x.hash,
            (o, o2) => o.compareTo(o2),
        );

        const nodes: ReachabilityNode[] = [...this.allNodes.filter(n => (!n.isReachableMarkingsCalculated && n.depth < depth))];
        let i = 0;

        if (ReachabilitySettings.automaticalyStopCalculationAfterSeconds > 0)
            setTimeout(() => { this.calculatingToDepth = false }, ReachabilitySettings.automaticalyStopCalculationAfterSeconds * 1000);

        while (nodes.length > 0 && this.calculatingToDepth) {
            const node = nodes.shift();

            if (node.depth >= depth) continue;

            nodes.push(...(await node.reachableMarkingNonCyclic()).map(x => x.node).filter(n => hash.add(n)));
        }

        this.calculatingToDepth = false;
    }

    constructor(net: JSONNet) {
        this.hashSetNodes = new HashSet<ReachabilityNode>(
            (x) => x.hash,
            (o, o2) => o.compareTo(o2),
        )

        this.net = net;

        const mark: placeMarking[] = this.net.places.map(x => { return { id: x.id, marking: x.marking } });
        const hash = ReachabilityTree.getMarkingHash(mark);

        this.root = new ReachabilityNode(this, hash, mark, 0, ++this.idGen);

        this.allNodes = [this.root];
    }
}

export class ReachabilityNode {
    public readonly tree: ReachabilityTree;

    /** number of actions needed to get to this markings */
    public readonly depth: number;

    public readonly id: number;

    public readonly hash: number;
    public readonly markings: placeMarking[];
    private _reachableMarkings: ReachableMarkings;

    public get isReachableMarkingsCalculated(): boolean {
        return !!this._reachableMarkings;
    }

    public async reachableMarkings(): Promise<ReachableMarkings> {
        if (!this.isReachableMarkingsCalculated)
            await this.tree.calculateReachableMarkingsForNode(this);

        return this._reachableMarkings;
    }

    public async reachableMarkingNonCyclic(): Promise<ReachableMarkings> {
        return (await this.reachableMarkings()).filter(n => n.node.depth > this.depth);
    }

    public compareTo(other: ReachabilityNode): boolean {
        return this.markings.every(p => { return other.markings.find(x => x.id === p.id).marking === p.marking; });
    }

    constructor(tree: ReachabilityTree, hash: number, markings: placeMarking[], depth: number, id: number) {
        this.tree = tree;
        this.hash = hash;
        this.markings = markings;
        this.depth = depth;
        this.id = id;
    }
}

type placeMarking = { id: number, marking: number };
type ReachableMarkings = { node: ReachabilityNode, transitionID: number }[];
