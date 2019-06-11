import { d3BaseSelector } from "../../../Constants";
import { PNEditor } from "../../../PNEditor";


export class PNControls {
    private readonly container: d3BaseSelector;


    constructor(container: d3BaseSelector, editor: PNEditor) {
        this.container = container
            .style("background", "lightgray")

        container
            .style("margin", ".4em")

        container.append("input")
            .attr("type", "button")
            .attr("value", "UNDO")
            .style("width", "95px")
            .on("click", () => { editor.pnAction.Undo(); editor.pnDraw.update(); })

        container.append("input")
            .attr("type", "button")
            .attr("value", "REDO")
            .style("width", "95px")
            .on("click", () => { editor.pnAction.Redo(); editor.pnDraw.update(); })

        container.append("input")
            .attr("type", "button")
            .attr("value", "Analyze")
            .style("width", "95px")


    }
}
