export abstract class ModelBase<JSONType>{
    // todo: update model
    // bude se používat v případě že se změní data v navázaných modelech -> přepočítání
    //    public abstract update(updated?: {modela?: modelType ...})

    /** serialize object to json */
    public abstract toJSON(): JSONType;
    /** try to deserialize object from json */
    public abstract fromJSON(json: JSONType): boolean;

    /** copy of the object (by json fncs) */
    public get Copy(): this {
        const obj = (new (this.constructor()) as this);
        obj.fromJSON(this.toJSON());
        return obj;
    };
}