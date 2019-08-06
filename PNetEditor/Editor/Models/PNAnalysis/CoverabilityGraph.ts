import { JSONNet, marking, GetEnabledTransitionsIDs, CalculateNextConfiguration } from "../PNet/PNModel";
import { numbers } from "../../../CORE/Constants";
import { AsyncForeach, SortKeySelector, flatten, sleep } from "../../../Helpers/purify";
import { sha1 } from 'object-hash';
import { ModelBase } from "../_Basic/ModelBase";
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

export class CoverabilityGraph extends ModelBase<CoverabilityGraphJSON> {

    public readonly net: JSONNet;

    public calculated = false;
    private root: Vertice;
    private graph: Graph;

    public CancelCalculations() {
        const call = (x: () => void) => { x() };
        this.cancelFuncs.forEach(call);
    }

    private cancelFuncs: (() => void)[] = [];

    public async CalculateHashed() {
        const rootHash = sha1(this.root);
        const vertices: { [key: string]: marking[] } = {};
        vertices[rootHash] = [this.root];
        const graphHashed: GraphHashed = { V: vertices, E: [] };
        const WorkSet: { markingHashed: markingHashed, transition: TransitionID }[] = [];

        let cancel = false;
        const cancelFnc = () => {
            cancel = true;
        }
        this.cancelFuncs.push(cancelFnc);

        GetEnabledTransitionsIDs(this.net, this.root).forEach(transition => {
            WorkSet.push({ markingHashed: { hash: rootHash, marking: this.root }, transition });
        });

        let WorkSetLength = -1;
        while ((WorkSetLength = WorkSet.length) > 0) {
            await new Promise(r => setTimeout(r));
            if (cancel) return;

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

                await AsyncForeach(graphHashed.E.filter(x => x.to.hash === hash && isSameMarking(x.to.marking, node)),
                    x => searchAvailebleFrom(x.from));
            }
            await searchAvailebleFrom({ marking, hash });

            flatten(Object.keys(availableFromHashed).map(h => { return availableFromHashed[h]; }))
                .filter(x => isLowerSameMarking(x, calculatedMarking)).forEach(availebleFromMarking => {
                    availebleFromMarking.forEach(p => {
                        const pmark = calculatedMarking.find(pp => pp.id === p.id);
                        if (p.marking < pmark.marking) {
                            pmark.marking = numbers.omega;
                        }
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
        const graphChanged = this.graph.V.length === 1 || graph.V.length < this.graph.V.length;
        if (graphChanged) {
            this.graph = graph;
        }
        console.debug("calculating done");
        this.calculated = true;
        { let cancelFncIndex = -1; if ((cancelFncIndex = this.cancelFuncs.findIndex(x => x === cancelFnc)) !== -1) this.cancelFuncs.splice(cancelFncIndex, 1); }
    }


    public async Calculate() {
        const graph: Graph = { V: [this.root], E: [] };
        const WorkSet: { marking: marking, transition: TransitionID }[] = [];

        let cancel = false;
        const cancelFnc = () => {
            cancel = true;
        }
        this.cancelFuncs.push(cancelFnc);


        GetEnabledTransitionsIDs(this.net, this.root).forEach(transition => {
            WorkSet.push({ marking: this.root, transition });
        });

        let WorkSetLength = -1;
        while ((WorkSetLength = WorkSet.length) > 0) {
            await sleep();
            if (cancel) return;

            const nextCalculateIndex = Math.floor(Math.random() * WorkSetLength);
            const { marking, transition } = WorkSet.splice(nextCalculateIndex, 1)[0];

            const calculatedMarking = CalculateNextConfiguration(this.net, marking, transition).marking;

            const availableFrom = [] as marking[];
            const searchAvailebleFrom = async (node: marking) => {
                if (availableFrom.some(x => x === node)) return;
                availableFrom.push(node);
                
                await AsyncForeach(graph.E.filter(x => x["2"] === node),
                    x => searchAvailebleFrom(x["0"]))
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
        { let cancelFncIndex = -1; if ((cancelFncIndex = this.cancelFuncs.findIndex(x => x === cancelFnc)) !== -1) this.cancelFuncs.splice(cancelFncIndex, 1); }
    }


    //#region Coverability graph mathematical properties

    public get hasConsumingTransition(): boolean {
        const net = this.net;
        return net.transitions.some(t => net.arcs.filter(a => a.transition_id === t.id).map(a => (a.toPlace || 0) - (a.toTransition || 0)).reduce(((a, b) => a + b),0) < 0);
    }

    public get containstOmega(): boolean {
        return this.graph.V.some(x => x.some(y => y.marking === omega));
    }
    public get numStates(): number {
        return this.graph.V.length;
    };
    public get maxMarking(): number {
        return Math.max(...this.graph.V.map(x => Math.max(...x.map(y => y.marking).filter(y => y !== omega))));
    };

    public get reversible(): boolean {
        if (this.containstOmega) {
            if (!this.hasConsumingTransition)
                return false;
        }

        const g = this.graph;
        const len = g.V.length;
        const fromToArray: boolean[][] = [];
        for (var i = 0; i < len; i++) {
            const arr = [];
            for (var j = 0; j < len; j++) {
                arr.push(false);
            }
            fromToArray.push(arr);
        }

        g.E.forEach(e => {
            const from = g.V.findIndex(x => isSameMarking(x, e["0"]));
            const to = g.V.findIndex(x => isSameMarking(x, e["2"]));
            fromToArray[from][to] = true;
        });

        let changed: boolean;
        do {
            changed = false;

            for (var from = 0; from < len; from++) {
                for (var to = 0; to < len; to++) {
                    if (fromToArray[from][to]) {
                        for (var fromTo = 0; fromTo < len; fromTo++) {
                            if (fromToArray[to][fromTo]) {
                                if (!fromToArray[from][fromTo]) {
                                    fromToArray[from][fromTo] = true;
                                    changed = true;
                                }
                            }
                        }
                    }
                }
            }
        } while (changed);

        for (var i = 0; i < len; i++) {
            for (var j = 0; j < len; j++) {
                if (fromToArray[i][j] === false)
                    return this.containstOmega && null;
            }
        }

        return true;
    }

    // todo: max počet kroků ?
    public get terminates(): boolean {
        if (this.containstOmega)
            return false;
        const g = this.graph;
        const len = g.V.length;
        const fromToArray: boolean[][] = [];
        for (var i = 0; i < len; i++) {
            const arr = [];
            for (var j = 0; j < len; j++) {
                arr.push(false);
            }
            fromToArray.push(arr);
        }

        g.E.forEach(e => {
            const from = g.V.findIndex(x => isSameMarking(x, e["0"]));
            const to = g.V.findIndex(x => isSameMarking(x, e["2"]));
            fromToArray[from][to] = true;
        });

        let changed: boolean;
        do {
            changed = false;

            for (var from = 0; from < len; from++) {
                for (var to = 0; to < len; to++) {
                    if (fromToArray[from][to]) {
                        for (var fromTo = 0; fromTo < len; fromTo++) {
                            if (fromToArray[to][fromTo]) {
                                if (!fromToArray[from][fromTo]) {
                                    fromToArray[from][fromTo] = true;
                                    changed = true;
                                }
                            }
                        }
                    }
                }
            }

            for (var i = 0; i < len; i++) {
                if (fromToArray[i][i] === true)
                    return false;
            }
        } while (changed);

        return true;
    }

    public get live(): boolean {
        if (this.weaklyLive === false)
            return false;
        return this.net.transitions.every(t => {
            return this.graph.V.every((m,mi) => {
                const visited = [] as marking[];
                const checkMarking = (mark: marking): boolean => {
                    if (visited.some(x => x === mark))
                        return false;
                    visited.push(mark);
                    const comesFromThis = this.graph.E.filter(e => isSameMarking(e["0"], mark));
                    if (comesFromThis.some(x => x["1"] === t.id))
                        return true;
                    return comesFromThis.some(x => checkMarking(x["2"]));
                }
                return checkMarking(m);
            });
        });
    }

    public get weaklyLive(): boolean {
        return this.net.transitions.every(t => this.graph.E.some(e => e["1"] === t.id));
    }

    public get deadlockFree() {
        const g = this.graph;
        return g.V.every(V => g.E.filter(E => E["0"] === V).length > 0);
    }

    //#endregion

    public toJSON(): CoverabilityGraphJSON {
        const graph = this.graph;
        const root = this.root;
        return { graph, root };
    }

    public fromJSON(json: CoverabilityGraphJSON): boolean {
        Object.assign(this, json);
        this.calculated = json.graph.V.length > 0;
        return true;
    }

    constructor(net: JSONNet) {
        super();
        this.net = net;

        const marking: marking = this.net.places.map(x => { return { id: x.id, marking: x.marking } });

        this.root = marking;
        this.graph = { V: [this.root], E: [] };
    }
}

type CoverabilityGraphJSON = { graph: Graph, root: Vertice };

/** returns true if first marking is lower than second for all places */
function isLowerSameMarking(first: marking, second: marking) {
    return second.findIndex(sp => first.find(x => x.id === sp.id).marking > sp.marking) === -1;
}

function isSameMarking(one: marking, another: marking) {
    return one === another ||
        (one.every(x => (another.find(y => y.id === x.id) || { marking: 0 }).marking === x.marking)
            && another.every(x => (one.find(y => y.id === x.id) || { marking: 0 }).marking === x.marking));
}

function markingToString(mark: marking) {
    if (mark.length === 0)
        return "";
    return mark.sort(SortKeySelector(x => x.id)).map(y => y.marking === omega ? "ω" : y.marking + "").reduce((x, y) => x + y);
}
