import { PNModel, Place, Transition } from "./Models/PNet/PNetModel";
import { PNAction } from "./Models/PNet/PNetAction";


export class PNTab {
    heading: string = "todo headings";

    private _net: PNModel;
    public get net(): PNModel { return this._net; }
    public set net(val: PNModel) { this._net = val; this._action = val == null ? null : new PNAction(val); }

    private _action: PNAction;
    public get action(): PNAction { return this._action; }

    file: string | null;
    selected: {
        places: Place[];
        tranisitons: Transition[];
    }
}

