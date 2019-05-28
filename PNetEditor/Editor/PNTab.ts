import { PNet, Place, Transition } from "./PNet";


export class PNTab {
    heading: string = "todo headings";
    net: PNet;
    file: string | null;
    selected: {
        places: Place[];
        tranisitons: Transition[];
    }
}

