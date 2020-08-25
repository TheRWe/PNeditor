import { ModelBase } from "./ModelBase";

/** Class for catching  */
export abstract class ActionBase<modelType extends ModelBase<any>>{
    public readonly model: modelType;

    /** callback called when model is changed */
    public AddOnModelChange(callback: (model: modelType) => void): void {
        const old = this.onModelChange;
        this.onModelChange = (...args) => { old(...args); callback(...args); }
    }

    protected onModelChange = (model: modelType) => { };
    /** must be called everytime model changes */
    public CallOnModelChange() {
        this.onModelChange(this.model);
    }

    constructor(model: modelType) {
        this.model = model;
    }
}
