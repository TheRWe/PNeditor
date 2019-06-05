import { Tab } from "../CORE/TabControl/Tab";
import { d3BaseSelector } from "../Editor/Constants";
import { PNModel } from "./Models/PNet/PNModel";
import { PNDraw } from "./Models/PNet/PNDraw";
import { PNAction } from "../_Editor/Models/PNet/PNetAction";

export class PNEditor {
    public readonly tab: Tab;
    public readonly svg: d3BaseSelector

    public readonly pnModel: PNModel;
    public readonly pnDraw: PNDraw;
    public readonly pnAction: PNAction;


    constructor(tab: Tab, pnmodel: PNModel) {
        this.tab = tab;

        this.svg = tab.container.append("svg");
        this.pnModel = pnmodel;

        this.pnAction = new PNAction(pnmodel);

        this.pnDraw = new PNDraw(this.svg);
        this.pnDraw.data = pnmodel;
        this.pnDraw.update();
    }
}

