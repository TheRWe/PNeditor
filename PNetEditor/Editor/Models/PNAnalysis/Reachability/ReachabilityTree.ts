import { JSONNet } from "../../PNet/PNModel";
import { numbers } from "../../../../CORE/Constants";
import { GraphNode, Graph } from "../../../../CORE/Graph";
import { AsyncForeach, SortKeySelector } from "../../../../Helpers/purify";
const omega = numbers.omega;

type placeMarking = { id: number, marking: number };
type marking = placeMarking[];
type _markingType = {
    marking: marking,
    calculatedNextMarking: boolean,
};
type markingNode = GraphNode<_markingType>;
type markingGraph = Graph<_markingType>;

export const ReachabilitySettings = {
    defaultCalculationDepth: 100,
    MaxMarking: 999,
    GraphDepthDefault: 15,
    automaticalyStopCalculationAfterSeconds: 60,
}

// todo: jako model
export class ReachabilityTree {
    public readonly net: JSONNet;

    public readonly root: markingNode;
    public readonly graph: markingGraph;

    private _isAllPossibleNodesCalculatedCache: "false" | "true" | "" = "";
    public isAllPossibleNodesCalculated() {
        if (this._isAllPossibleNodesCalculatedCache === "") {
            for (const node of this.graph.allNodes) {
                if (!node.data.calculatedNextMarking) {
                    this._isAllPossibleNodesCalculatedCache = "false";
                    break;
                }
            }

            if (this._isAllPossibleNodesCalculatedCache === "")
                this._isAllPossibleNodesCalculatedCache = "true";
        }

        return this._isAllPossibleNodesCalculatedCache === "true";
    }

    private idGen = 0;
    public async calculateReachableMarkingsForNode(node: markingNode): Promise<void> {
        if (node.data.calculatedNextMarking) return; node.data.calculatedNextMarking = true;
        this._isAllPossibleNodesCalculatedCache = "";

        const enabledTransitions = this.net.transitions.map(t => {
            return { id: t.id, arcs: this.net.arcs.filter(x => x.transition_id === t.id) };
        }).filter(t => t.arcs.every(a => {
            const place = node.data.marking.find(m => m.id === a.place_id);
            return (place.marking === omega) || (a.toTransition <= place.marking);
        }));


        await AsyncForeach(
            enabledTransitions,
            async (t) => {
                const newMark: marking = node.data.marking.map(p => {
                    const arc = t.arcs.find(x => x.place_id === p.id);
                    if (arc === undefined)
                        return { id: p.id, marking: p.marking };
                    else {
                        const marking = p.marking === numbers.omega ? numbers.omega
                            : p.marking + (arc.toPlace || 0) - (arc.toTransition || 0);
                        return { id: p.id, marking };
                    }
                });

                if (newMark.findIndex(x => (x.marking > ReachabilitySettings.MaxMarking && x.marking !== omega)) >= 0)
                    return;

                let existingNodeIndex: number;
                const nextNode =
                    ((existingNodeIndex = this.graph.allNodes.findIndex(x => compareMarking(x.data.marking, newMark))) === -1)
                        ? this.graph.CreateNode({ marking: newMark, calculatedNextMarking: false })
                        : this.graph.allNodes[existingNodeIndex];

                this.graph.Connect(node, nextNode);
            }
        );
        await this.Omeganize();
        await this.OptimizeGraph();
    }

    private async Omeganize() {
        [...this.graph.allNodes].forEach(node => {
            const precedingNodes = this.graph.GetAllAccessibleTo(node);
            precedingNodes
                .filter(x => isLowerSameMarking(x.data.marking, node.data.marking))
                .forEach(prec => {
                    let foundOmega = () => {
                        console.debug("found omega");
                        console.debug(markingToString(prec.data.marking))
                        console.debug(markingToString(node.data.marking))
                    }
                    node.data.marking.forEach(place => {
                        if (place.marking === omega) return;
                        const prevplace = prec.data.marking.find(p => place.id === p.id);
                        if (prevplace.marking < place.marking) {
                            foundOmega();
                            foundOmega = () => { };
                            place.marking = omega;
                        }
                    })
                });
        });

        [...this.graph.allNodes].forEach(node => {
            const nextNodes = this.graph.GetAllAccessibleFrom(node);
            node.data.marking.filter(x => x.marking === omega).forEach(p => {
                nextNodes.forEach(next => {
                    next.data.marking.find(x => x.id === p.id).marking = omega;
                });
            });
        });
    }

    private async OptimizeGraph() {
        const g = this.graph;
        [...g.allNodes].forEach(node => {
            const nextNodes = g.GetAllAccessibleFrom(node).filter(x => x !== node);
            nextNodes.forEach(next => {
                if (!isLowerSameMarking(node.data.marking, next.data.marking)) return;
                console.debug("optimizating");
                console.debug(markingToString(node.data.marking));
                console.debug(markingToString(next.data.marking));

                g.CopyConnections(node, next);
                g.Remove(node);


            })
        });
    }


    public calculatingToDepth = false;
    public async calculateToDepth(depth: number) {
        this.calculatingToDepth = true;

        if (ReachabilitySettings.automaticalyStopCalculationAfterSeconds > 0)
            setTimeout(() => { this.calculatingToDepth = false }, ReachabilitySettings.automaticalyStopCalculationAfterSeconds * 1000);

        const calculatedNodes: markingNode[] = [];

        const rec = async (node: markingNode, d: number) => {
            if (!this.calculatingToDepth || calculatedNodes.findIndex(x => x === node) >= 0) return;
            calculatedNodes.push(node);

            await this.calculateReachableMarkingsForNode(node);

            if (d < depth) {
                const dd = d + 1;
                await Promise.all(node.ConnectedTo.map(x => rec(x, dd)));
            }
        }
        await rec(this.root, 0);

        this.graph.allNodes.map(x => markingToString(x.data.marking))
            .forEach(x => {
                console.debug(x);
            })


        this.calculatingToDepth = false;
    }

    constructor(net: JSONNet) {
        this.net = net;

        const marking: marking = this.net.places.map(x => { return { id: x.id, marking: x.marking } });

        this.graph = new Graph<_markingType>();

        const root = this.root = this.graph.CreateNode();
        root.data = { marking, calculatedNextMarking: false };
    }
}

/**  */
function compareMarking(m1: marking, m2: marking) {
    return m1.every(x => { const mark = (m2.find(y => y.id === x.id).marking) || 0; return mark === x.marking || x.marking === omega || mark === omega }) &&
        m2.every(x => { const mark = (m1.find(y => y.id === x.id).marking) || 0; return mark === x.marking || x.marking === omega || mark === omega });
}

/** returns true if first marking is lower than second for all places */
function isLowerSameMarking(first: marking, second: marking) {
    return second.findIndex(sp => first.find(x => x.id === sp.id).marking > sp.marking) === -1;
}

function markingToString(mark: marking) {
    return mark.sort(SortKeySelector(x => x.id)).map(y => y.marking === omega ? "ω" : y.marking + "").reduce((x, y) => x + y);
}