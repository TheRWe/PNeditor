import { JSONNet, marking, GetEnabledTransitionsIDs, CalculateNextConfiguration, Transition } from "../../PNet/PNModel";
import { numbers } from "../../../../CORE/Constants";
import { GraphNode } from "../../../../CORE/Graph";
import { AsyncForeach, SortKeySelector } from "../../../../Helpers/purify";
const omega = numbers.omega;

type TransitionID = number;
type Vertice = marking;
type Edge = [marking, TransitionID, marking];
type Graph = { V: marking[], E: Edge[] };

export const ReachabilitySettings = {
    MaxMarking: 999,
    automaticalyStopCalculationAfterSeconds: 60,
}

// todo: jako model
export class CoverabilityGraph {
    public readonly net: JSONNet;

    public root: Vertice;
    public graph: Graph;

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
            const searchAvailebleFrom = (node: marking) => {
                if (availableFrom.some(x => x === node)) return;
                availableFrom.push(node);
                graph.E.filter(x => x["2"] === node).map(x => x["0"]).forEach(x => searchAvailebleFrom(x));
            }
            searchAvailebleFrom(marking);

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

        console.groupCollapsed("calculation done");
        if (this.graph.V.length === 1 || this.graph.V.length > graph.V.length) {
            console.debug("graph updated");
            this.graph = graph;
        }
        console.groupCollapsed("V");
        graph.V.forEach(x => console.debug(markingToString(x)));
        console.groupEnd();
        console.groupCollapsed("E");
        graph.E.forEach(x => console.debug(markingToString(x["0"]) + "  " + x["1"] + "  " + markingToString(x["2"])));
        console.groupEnd();
        console.groupEnd();
    }


    //#region Coverability graph mathematical properties

    public get containstOmega(): boolean {
        return this.graph.V.some(x => x.some(y => y.marking === numbers.omega));
    }
    public get isCalculating(): boolean {
        //todo: implementovat ?
        return undefined;
    };
    public get numStates(): number {
        return this.graph.V.length;
    };
    public get isCalculatedAllMarking(): boolean {
        //todo: implementovat ?
        return undefined;
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