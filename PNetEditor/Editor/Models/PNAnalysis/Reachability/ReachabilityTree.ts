import { JSONNet, marking, GetEnabledTransitionsIDs, CalculateNextConfiguration, Transition } from "../../PNet/PNModel";
import { numbers } from "../../../../CORE/Constants";
import { GraphNode } from "../../../../CORE/Graph";
import { AsyncForeach, SortKeySelector, flatten } from "../../../../Helpers/purify";
import { sha1 } from 'object-hash';
const omega = numbers.omega;

type TransitionID = number;
type Vertice = marking;
type Edge = [Vertice, TransitionID, Vertice];
type Graph = { V: Vertice[], E: Edge[] };

type markingHashed = { hash: string, marking: marking };
type EdgeHashed = { from: { hash: string, marking: Vertice }, TransitionID: TransitionID, to: { hash: string, marking: Vertice } };
type GraphHashed = { V: { [key: string]: Vertice[] }, E: EdgeHashed[] };

export const ReachabilitySettings = {
    MaxMarking: 999,
    automaticalyStopCalculationAfterSeconds: 60,
}

// todo: jako model
export class CoverabilityGraph {
    public readonly net: JSONNet;

    public calculated = false;
    private root: Vertice;
    private graph: Graph;

    public async CalculateHashed() {
        const rootHash = sha1(this.root);
        const vertices: { [key: string]: marking[] } = {}; vertices[rootHash] = [this.root];
        const graphHashed: GraphHashed = { V: {}, E: [] };
        const WorkSet: { markingHashed: markingHashed, transition: TransitionID }[] = [];

        GetEnabledTransitionsIDs(this.net, this.root).forEach(transition => {
            WorkSet.push({ markingHashed: { hash: rootHash, marking: this.root }, transition });
        });

        let WorkSetLength = -1;
        while ((WorkSetLength = WorkSet.length) > 0) {
            await new Promise(r => setTimeout(r));

            const nextCalculateIndex = Math.floor(Math.random() * WorkSetLength);
            const { markingHashed: { marking, hash }, transition } = WorkSet.splice(nextCalculateIndex, 1)[0];

            const calculatedMarking = CalculateNextConfiguration(this.net, marking, transition).marking;

            const availableFromHashed = {} as { [hash: string]: marking[] };
            const searchAvailebleFrom = async ({ hash, marking: node }: markingHashed) => {
                if (availableFromHashed[hash]
                    && availableFromHashed[hash].some(x => isSameMarking(x, node)))
                    return;
                availableFromHashed[hash] = availableFromHashed[hash] || [];
                availableFromHashed[hash].push(node);

                await Promise.all(graphHashed.E.filter(x => x.to.hash === hash && isSameMarking(x.to.marking, node)).map(x => x.from).map(x => searchAvailebleFrom(x)));
            }
            await searchAvailebleFrom({ marking, hash });
            console.debug({ availableFromHashed, flattened: flatten(Object.keys(availableFromHashed).map(h => { return availableFromHashed[h]; })) });

            flatten(Object.keys(availableFromHashed).map(h => { return availableFromHashed[h]; }))
                .filter(x => isLowerSameMarking(x, calculatedMarking)).forEach(availebleFromMarking => {
                    availebleFromMarking.forEach(p => {
                        const pmark = calculatedMarking.find(pp => pp.id === p.id);
                        if (p.marking < pmark.marking)
                            pmark.marking = numbers.omega;
                    });
                });

            const calculatedMarkingHash = sha1(calculatedMarking);

            if (!(graphHashed.V[calculatedMarkingHash] && graphHashed.V[calculatedMarkingHash].some(x => isSameMarking(x, calculatedMarking)))) {
                graphHashed.V[calculatedMarkingHash] = graphHashed.V[calculatedMarkingHash] || [];
                graphHashed.V[calculatedMarkingHash].push(calculatedMarking);
                GetEnabledTransitionsIDs(this.net, calculatedMarking).forEach(tID => {
                    WorkSet.push({ markingHashed: { hash: calculatedMarkingHash, marking: calculatedMarking }, transition: tID });
                });
            }

            graphHashed.E.push({ from: { marking, hash }, TransitionID: transition, to: { hash: calculatedMarkingHash, marking: calculatedMarking } });
        }

        //console.debug(`found collisions${Object.keys(graphHashed.V).map(x => graphHashed.V[x]).filter(x => x.length > 1).length}`);

        const graph: Graph = {
            E: graphHashed.E.map(x => { return [x.from.marking, x.TransitionID, x.to.marking] as Edge; }),
            V: flatten(Object.keys(graphHashed.V).map(x => graphHashed.V[x]))
        };

        const graphChanged = this.graph.V.length === 1 || this.graph.V.length > graph.V.length;
        if (graphChanged) {
            this.graph = graph;
        }
        console.debug("calculating done");
        this.calculated = true;
    }


    public async Calculate() {
        const graph: Graph = { V: [this.root], E: [] };
        const WorkSet: { marking: marking, transition: TransitionID }[] = [];

        GetEnabledTransitionsIDs(this.net, this.root).forEach(transition => {
            WorkSet.push({ marking: this.root, transition });
        });

        let WorkSetLength = -1;
        while ((WorkSetLength = WorkSet.length) > 0) {
            await new Promise(r => setTimeout(r));

            const nextCalculateIndex = Math.floor(Math.random() * WorkSetLength);
            const { marking, transition } = WorkSet.splice(nextCalculateIndex, 1)[0];

            const calculatedMarking = CalculateNextConfiguration(this.net, marking, transition).marking;

            const availableFrom = [] as marking[];
            const searchAvailebleFrom = async (node: marking) => {
                if (availableFrom.some(x => x === node)) return;
                availableFrom.push(node);
                await Promise.all(graph.E.filter(x => x["2"] === node).map(x => x["0"]).map(x => searchAvailebleFrom(x)));
            }
            await searchAvailebleFrom(marking);

            availableFrom.filter(x => isLowerSameMarking(x, calculatedMarking)).forEach(availebleFromMarking => {
                availebleFromMarking.forEach(p => {
                    const pmark = calculatedMarking.find(pp => pp.id === p.id);
                    if (p.marking < pmark.marking)
                        pmark.marking = numbers.omega;
                });
            });

            if (!graph.V.some(x => isSameMarking(x, calculatedMarking))) {
                graph.V.push(calculatedMarking);
                GetEnabledTransitionsIDs(this.net, calculatedMarking).forEach(tID => {
                    WorkSet.push({ marking: calculatedMarking, transition: tID });
                });
            }
            graph.E.push([marking, transition, calculatedMarking]);
        }

        const graphChanged = this.graph.V.length === 1 || this.graph.V.length > graph.V.length;
        if (graphChanged) {
            this.graph = graph;
        }
        console.debug("calculating done");
        this.calculated = true;
    }


    //#region Coverability graph mathematical properties

    public get containstOmega(): boolean {
        return this.graph.V.some(x => x.some(y => y.marking === numbers.omega));
    }
    public get numStates(): number {
        return this.graph.V.length;
    };
    public get maxMarking(): number {
        return Math.max(...this.graph.V.map(x => Math.max(...x.map(y => y.marking).filter(y => y !== numbers.omega))));
    };

    public get reversible(): boolean {
        const g = this.graph;
        const root = this.root;

        //todo: implementovat!
        return undefined;
    }

    // todo: zkontrolovat že funguje
    public get terminates(): boolean {
        /*
        const g = this.graph;
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
        */
        //todo: implementovat!
        return undefined;
    }

    public get deadlockFree() {
        const g = this.graph;
        return g.V.every(V => g.E.filter(E => E["0"] === V).length > 0);
    }

    //#endregion


    constructor(net: JSONNet) {
        this.net = net;

        const marking: marking = this.net.places.map(x => { return { id: x.id, marking: x.marking } });

        this.root = marking;
        this.graph = { V: [this.root], E: [] };
    }
}

/** returns true if first marking is lower than second for all places */
function isLowerSameMarking(first: marking, second: marking) {
    return second.findIndex(sp => first.find(x => x.id === sp.id).marking > sp.marking) === -1;
}

function isSameMarking(one: marking, another: marking) {
    return one.every(x => another.find(y => y.id === x.id).marking === x.marking)
        && another.every(x => one.find(y => y.id === x.id).marking === x.marking);
}

function markingToString(mark: marking) {
    if (mark.length === 0)
        return "";
    return mark.sort(SortKeySelector(x => x.id)).map(y => y.marking === omega ? "ω" : y.marking + "").reduce((x, y) => x + y);
}