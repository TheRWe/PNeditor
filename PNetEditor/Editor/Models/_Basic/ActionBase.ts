import { ModelBase } from "./ModelBase";


export abstract class ActionBase<modelType extends ModelBase<any>>{
    public readonly model: modelType;

    /** callback called when model is changed */
    public AddOnModelChange(callback: () => void): void {
        const old = this.onModelChange;
        this.onModelChange = (...args) => { old(...args); callback(...args); }
    }
    protected onModelChange = () => { };

    constructor(model: modelType) {
        this.model = model;
    }
}
