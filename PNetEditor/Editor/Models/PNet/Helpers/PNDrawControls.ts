import { d3BaseSelector } from "../../../../CORE/Constants";
import { PNEditor } from "../../../PNEditor";
import { ToggleSwitch } from "../../../../CORE/ToggleSwitch";
import { MakeZoomInOutIcon } from "../../../../Helpers/purify";


export class PNDrawControls {
    private readonly container: d3BaseSelector;
    public readonly toggleSwitchRunEdit: ToggleSwitch;

    constructor(container: d3BaseSelector, editor: PNEditor) {
        this.container = container
            .style("background", "lightgray")

        container
            .style("margin", ".4em")

        container.append("input")
            .attr("type", "button")
            .attr("value", "⇦")
            .style("width", "1.5em")
            .style("font-size", "1.5em")
            .style("height", "1.4em")
            .style("padding-top",".1em")
            .on("click", () => { editor.pnAction.Undo(); editor.pnDraw.update(); })

        container.append("input")
            .attr("type", "button")
            .attr("value", "⇨")
            .style("width", "1.5em")
            .style("font-size", "1.5em")
            .style("height", "1.4em")
            .style("padding-top",".1em")
            .on("click", () => { editor.pnAction.Redo(); editor.pnDraw.update(); })

        container.append("input")
            .attr("type", "button")
            .attr("value", "🖶")
            .style("width", "1.5em")
            .style("font-size", "1.5em")
            .style("height", "1.4em")
            .style("padding-top", ".1em")
            .on("click", () => {
                editor.pnDraw.container.classed("print", true);
                window.print();
                editor.pnDraw.container.classed("print", false);
            })
            ;


        // todo: omezení max min velikost
        //container.append("span").text("🔍 ");

        const zoomInContainer = container
            .append("div")
            .style("display", "inline-block")
            .style("font-size", "1.8em")
            .style("cursor", "pointer")
            .on("click", () => { editor.pnDraw.scale += 0.1; })
            ;

        MakeZoomInOutIcon(zoomInContainer, "in");


        const zoomOutContainer = container
            .append("div")
            .style("display", "inline-block")
            .style("font-size", "1.8em")
            .style("cursor", "pointer")
            .on("click", () => { editor.pnDraw.scale -= 0.1; })
            ;

        MakeZoomInOutIcon(zoomOutContainer, "out");


        this.toggleSwitchRunEdit = new ToggleSwitch(container, "Edit", "Run");
    }
}
