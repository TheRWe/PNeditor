

export abstract class ModelBase<JSONType extends { referencedModels?: ModelBase<any>[] }>{
    public abstract toJSON(): JSONType;
    public abstract fromJSON(json: JSONType): boolean;

    public get Copy(): this {
        const obj = (new (this.constructor()) as this);
        obj.fromJSON(this.toJSON());
        return obj;
    };
}