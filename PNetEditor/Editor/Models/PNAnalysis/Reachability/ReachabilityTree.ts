import { JSONNet } from "../../PNet/PNModel";
import { ReachabilitySettings } from "../PNMarkingModel";
import { GetStringHash, HashSet } from "../../../../CORE/HashSet";

// todo: jako model
export class ReachabilityTree {
    public readonly net: JSONNet;

    public readonly root: ReachabilityNode;

    private static getMarkingHash(mark: placeMarking[]): number {
        return GetStringHash(JSON.stringify(mark.slice().sort()));
    }

    private readonly allNodes: ReachabilityNode[] = [];
    private readonly hashSetNodes: HashSet<ReachabilityNode>;

    private cacheIsAllPossibleNodesCalculated: "false" | "true" | "" = "";
    public async isAllPossibleNodesCalculated() {
        if (this.cacheIsAllPossibleNodesCalculated === "") {
            for (const node of this.allNodes) {
                if (!node.isReachableMarkingsCalculated) {
                    this.cacheIsAllPossibleNodesCalculated = "false";
                    break;
                }

                // todo: jinak ?
                await new Promise(r => { setTimeout(() => { r(); }); });
            }

            if (this.cacheIsAllPossibleNodesCalculated === "")
                this.cacheIsAllPossibleNodesCalculated = "true";
        }

        return this.cacheIsAllPossibleNodesCalculated === "true";
    }

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
                        const newMarkingNode = new ReachabilityNode(this, hash, newMark, node.index + 1);

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

        if ((await node.reachableNonCyclicMarking()).length > 0) {
            this.cacheIsAllPossibleNodesCalculated = "";
        }
    }

    public calculatingToDepth = false;
    public async calculateToDepth(depth: number) {
        this.calculatingToDepth = true;

        const nodes: ReachabilityNode[] = [this.root];

        while (nodes.length > 0) {
            const node = nodes.shift();

            // depth
            if (node.index >= depth) continue;

            if (this.calculatingToDepth)
                nodes.push(...(await node.reachableMarkings()).map(x => x.node));
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

        this.root = new ReachabilityNode(this, hash, mark, 0);

        this.allNodes = [this.root];
    }
}

export class ReachabilityNode {
    public readonly tree: ReachabilityTree;

    /** number of actions needed to get to this markings */
    public readonly index: number;

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

    public async reachableNonCyclicMarking(): Promise<ReachableMarkings> {
        return (await this.reachableMarkings()).filter(n => n.node.index > this.index);
    }

    public compareTo(other: ReachabilityNode): boolean {
        return this.markings.every(p => { return other.markings.find(x => x.id === p.id).marking === p.marking; });
    }

    constructor(tree: ReachabilityTree, hash: number, markings: placeMarking[], index: number) {
        this.tree = tree;
        this.hash = hash;
        this.markings = markings;
        this.index = index;
    }
}

type placeMarking = { id: number, marking: number };
type ReachableMarkings = { node: ReachabilityNode, transitionID: number }[];
