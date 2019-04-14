import { ModelBase, ModelJSONType } from "./ModelBase";
import { ActionBase } from "./ActionBase";
import { DrawBase } from "./DrawBase";
import { d3BaseSelector } from "../../Constants";



export abstract class CompoundBase<type extends ModelJSONType>{
    public abstract get model(): ModelBase<type>;
    public abstract get action(): ActionBase<ModelBase<type>>;
    public abstract get draw(): DrawBase<ModelBase<type>>;

    public abstract construct(data: ModelJSONType, svg: d3BaseSelector): boolean;
}

