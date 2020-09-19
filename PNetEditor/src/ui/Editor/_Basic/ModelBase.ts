export abstract class ModelBase<JSONType>{
  /** serialize object to json */
  public abstract toJSON(): JSONType;
  /** try to deserialize object from json */
  public abstract fromJSON(json: JSONType): boolean;

  /** copy of the object (by json fncs) */
  public get Copy(): this {
    const obj = (new (this.constructor()) as this);
    obj.fromJSON(this.toJSON());
    return obj;
  }
}