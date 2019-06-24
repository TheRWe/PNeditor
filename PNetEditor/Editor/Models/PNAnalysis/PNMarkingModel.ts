import { ModelBase } from "./../_Basic/ModelBase";
import { PNModel } from "../../Models/PNet/PNModel";
import { GetStringHash } from "../../../CORE/Hash";

export var ReachabilitySettings = {
    MarkingGraphDepth: 100,
    MaxMarking: 999,
    GraphNodesMax: 200,
}

export class PNMarkingModel extends ModelBase<PNMarkingJSON> {
    public toJSON(): PNMarkingJSON {
        return this.markings;
    }
    public fromJSON(json: PNMarkingJSON): boolean {
        this.markings = json;
        return true;
    }

    public get isCalculating() {
        return this._isCalculating;
    }
    public get isCalculatedAllMarking() {
        return this._calculatedAll;
    }
    public get numRechableMarkings() {
        return this.markings ? this.markings.markings.length : 0;
    }
    public get stepsFromInitialMarkingCalculated() {
        return this._stepsFromInitialMarkingCalculated;
    }
    public get maxMarking() {
        return this._maxMarking;
    }

    public getMarkingsModel() {
        const marks = [] as MarkingsObject[];
        for (var i = 0; i < this.markings.markings.length; i++) {
            const mark = this.markings.markings[i];
            marks.push(new MarkingsObject(i, mark.placeMarkings));
        }

        for (var i = 0; i < this.markings.markings.length; i++) {
            const mark = this.markings.markings[i];
            const markObj = marks.find(x => x.id == i);

            mark.accessibleTargetMarkings.forEach(atm => {
                markObj.accessibleTargetMarkings.push({ transitionID: atm.transitionID, target: marks.find(x => x.id === atm.index) });
            });
        }

        return marks;
    }

    private markings: PNMarkingJSON = null;

    private _isCalculating = false;
    public async UpdateModel(net: PNModel) {
        this._isCalculating = true;
        this._calculatedAll = null;
        this._stepsFromInitialMarkingCalculated = 0;
        this._containsCycles = null;
        this._maxMarking = 0;
        this._previoslyCalculatedNodes = 0;

        const transitions = net.transitions
            .map(x => {
                return {
                    id: x.id,
                    arces: net.getArcesOfTransition(x).map(a => {
                        return {
                            placeID: a.place.id,
                            toPlace: a.toPlace, toTransition: a.toTransition
                        };
                    }),
                };
            });

        this.markings = { markings: [], transitions };
        const placeMarkings: placeMarking[] = net.places.map(x => { return { id: x.id, marking: x.marking }; });
        const hash = PNMarkingModel.getMarkingHash(placeMarkings);

        this._maxMarking = Math.max(...placeMarkings.map(x => x.marking));
        this.markings.markings.push({ accessibleTargetMarkings: [], placeMarkings, hash });

        const t0 = performance.now();

        this.RecursiveCalculateMarkings(0, 0)
            .then(() => {
                const t1 = performance.now();

                console.debug({ reachibilityCalculationDone: this, possibleUniqueMarkings: this.markings.markings.length, time: (t1 - t0) });

                if (this._calculatedAll === null) this._calculatedAll = true;
                if (this._containsCycles === null) this._containsCycles = false;
                this._isCalculating = false;
                if (this._previoslyCalculatedNodes !== -1) this._onCalculatedNodesForGraph();
            });
    }

    private static getMarkingHash(mark: placeMarking[]) {
        return GetStringHash(JSON.stringify(mark.slice().sort()));
    }

    private _calculatedAll: boolean | null = null;
    private currentCalculations = {} as { [key: number]: true };
    private _stepsFromInitialMarkingCalculated: number = 0;
    private _containsCycles: boolean | null = null;
    private _maxMarking: number;

    public StopCalculations() {
        Object.keys(this.currentCalculations).forEach(k => {
            clearTimeout(+k);
            delete this.currentCalculations[k as any];
        });
    }

    private async RecursiveCalculateMarkings(markIndex: number, depth: number) {
        if (depth >= ReachabilitySettings.MarkingGraphDepth) {
            this._calculatedAll = false;
            return;
        }

        const mark = this.markings.markings[markIndex];
        const enabledTransitions = this.markings.transitions.filter(x => {
            return x.arces.every(a => {
                return mark.placeMarkings.find(xx => xx.id === a.placeID).marking >= a.toTransition;
            })
        })

        await Promise.all(
            enabledTransitions.map(t => {
                return new Promise((resolve) => {
                    const calcTimeoutIndx = setTimeout(() => {
                        this._stepsFromInitialMarkingCalculated = depth + 1;
                        const newMark = mark.placeMarkings.map(p => {
                            const arc = t.arces.find(a => a.placeID == p.id);
                            if (arc === undefined)
                                return { id: p.id, marking: p.marking };
                            else {
                                const marking = p.marking + (arc.toPlace || 0) - (arc.toTransition || 0);
                                if (marking > this._maxMarking)
                                    this._maxMarking = marking;
                                return { id: p.id, marking };
                            }
                        });

                        if (newMark.findIndex(x => x.marking > ReachabilitySettings.MaxMarking) >= 0) {
                            resolve();
                            return;
                        }

                        const hash = PNMarkingModel.getMarkingHash(newMark);

                        // todo: hash
                        const existingMarkingIndex =
                            this.markings.markings.findIndex(m => {
                                return m.hash === hash && m.placeMarkings.every(p => { return newMark.find(x => x.id === p.id).marking === p.marking; })
                            });

                        if (existingMarkingIndex >= 0) {
                            mark.accessibleTargetMarkings.push({ index: existingMarkingIndex, transitionID: t.id });
                            this._onCalculationChange();
                            delete this.currentCalculations[calcTimeoutIndx as any];
                            this._containsCycles = true;
                            resolve();
                        } else {
                            const index = this.markings.markings.push({ hash, placeMarkings: newMark, accessibleTargetMarkings: [] }) - 1;
                            mark.accessibleTargetMarkings.push({ index, transitionID: t.id });
                            this._onCalculationChange();
                            this.RecursiveCalculateMarkings(index, depth + 1)
                                .then(() => {
                                    delete this.currentCalculations[calcTimeoutIndx as any];
                                    resolve();
                                });
                        }
                    });
                    this.currentCalculations[calcTimeoutIndx as any] = true;
                });
            }));
    }

    private _onCalculationChange = () => { };
    public AddOnCalculationChange(callback: () => void) {
        const old = this._onCalculationChange; this._onCalculationChange = (...args) => { old(...args); callback(...args); };
    }

    private _previoslyCalculatedNodes = -1;
    private _onCalculatedNodesForGraph = () => { };
    public AddOnCalculatedNodesForGraph(callback: () => void) {
        const old = this._onCalculatedNodesForGraph; this._onCalculatedNodesForGraph = (...args) => { old(...args); callback(...args); };
    }

    constructor() {
        super();


        this.AddOnCalculationChange(() => {
            const prev = this._previoslyCalculatedNodes
            if (prev == -1)
                return;
            if (prev < ReachabilitySettings.GraphNodesMax) {
                const current = this.numRechableMarkings;
                if (current > ReachabilitySettings.GraphNodesMax) {
                    this._onCalculatedNodesForGraph();
                    this._previoslyCalculatedNodes = -1;
                } else {
                    this._previoslyCalculatedNodes = current;
                }
            }

        })
    }
}

type placeMarking = { id: number, marking: number };

export type PNMarkingJSON = {
    transitions: { id: number, arces: { placeID: number, toPlace: number, toTransition: number }[] }[],
    markings: {
        hash: number,
        accessibleTargetMarkings: { index: number, transitionID: number }[],
        placeMarkings: placeMarking[],
    }[]
}

export class MarkingsObject {
    public readonly id: number;

    public markigns: placeMarking[];
    public accessibleTargetMarkings: { target: MarkingsObject, transitionID: number }[] = [];


    constructor(id: number, markigns: placeMarking[]) {
        this.id = id;
        this.markigns = markigns;
    }
}
