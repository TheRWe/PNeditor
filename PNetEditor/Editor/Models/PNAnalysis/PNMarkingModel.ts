import { ModelBase } from "./../_Basic/ModelBase";
import { PNModel } from "../../Models/PNet/PNModel";
import { GetStringHash } from "../../../CORE/Hash";

export var ReachabilitySettings = {
    MarkingGraphDepth: 100,
    MaxMarking: 999,
}

export class PNMarkingModel extends ModelBase<PNMarkingJSON> {
    public toJSON(): PNMarkingJSON {
        return this.markings;
    }
    public fromJSON(json: PNMarkingJSON): boolean {
        this.markings = json;
        return true;
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

    private markings: PNMarkingJSON = null;

    public async UpdateModel(net: PNModel) {
        this._calculatedAll = null;
        this._stepsFromInitialMarkingCalculated = 0;
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
        this.markings.markings.push({ accessibleTargetMarkings: [], placeMarkings, hash });

        const t0 = performance.now();

        this.RecursiveCalculateMarkings(0, 0)
            .then(() => {
                const t1 = performance.now();

                console.debug({ reachibilityCalculationDone: this, possibleUniqueMarkings: this.markings.markings.length, time: (t1 - t0) });
                if (this._calculatedAll === null) this._calculatedAll = true;
            });
    }

    private static getMarkingHash(mark: placeMarking[]) {
        return GetStringHash(JSON.stringify(mark.slice().sort()));
    }

    private _calculatedAll: boolean | null = null;
    private currentCalculations = {} as { [key: number]: true };
    private _stepsFromInitialMarkingCalculated: number = 0;

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
                            else
                                return { id: p.id, marking: p.marking + (arc.toPlace || 0) - (arc.toTransition || 0) };
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
                    }, 10);
                    this.currentCalculations[calcTimeoutIndx as any] = true;
                });
            }));
    }

    private _onCalculationChange = () => { };
    public AddOnCalculationChange(callback: () => void) {
        const old = this._onCalculationChange; this._onCalculationChange = (...args) => { old(...args); callback(...args); };
    }

    constructor() {
        super();
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
