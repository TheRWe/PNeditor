import { d3BaseSelector } from "../../../../CORE/Constants";
import { PNEditor } from "../../../PNEditor";
import { ToggleSwitch } from "../../../../CORE/ToggleSwitch";
import { MakeZoomInOutIcon } from "../../../../Helpers/purify";


export class PNDrawControls {
    private readonly container: d3BaseSelector;
    public readonly toggleSwitchRunEdit: ToggleSwitch;

    constructor(container: d3BaseSelector, editor: PNEditor) {
        this.container = container
            .style("display", "flex")
            .style("align-items", "center")
            .classed("control-bar", true)
            ;

        container.append("input")
            .attr("type", "button")
            .attr("value", "⇦")
            .style("width", "1.5em")
            .style("font-size", "1.5em")
            .style("height", "1.4em")
            .style("padding-top", ".1em")
            .on("click", () => { editor.pnAction.Undo(); editor.pnDraw.update(); })

        container.append("input")
            .attr("type", "button")
            .attr("value", "⇨")
            .style("width", "1.5em")
            .style("font-size", "1.5em")
            .style("height", "1.4em")
            .style("padding-top", ".1em")
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
                const scale = editor.pnDraw.scale;
                editor.pnDraw.scale = 1;
                window.print();
                editor.pnDraw.scale = scale;
                editor.pnDraw.container.classed("print", false);
            })
            ;



        const zoomInContainer = container
            .append("div")
            .style("display", "inline-block")
            .style("font-size", "1.5em")
            .style("cursor", "pointer")
            .style("height", "1.4em")
            .on("click", () => {
                // todo: do settings
                if (editor.pnDraw.scale < 2)
                    editor.pnDraw.scale += 0.1;
            })
            .classed("button", true)
            ;

        MakeZoomInOutIcon(zoomInContainer, "in");
        zoomInContainer.select("svg")
            .style("margin-top", "0.2em")
            .style("margin-left", "0.2em")
            ;

        const zoomOutContainer = container
            .append("div")
            .style("display", "inline-block")
            .style("cursor", "pointer")
            .style("font-size", "1.5em")
            .style("height", "1.4em")
            .on("click", () => {
                // todo: do settings
                if (editor.pnDraw.scale > 0.3)
                    editor.pnDraw.scale -= 0.1;
            })
            .classed("button", true)
            ;

        MakeZoomInOutIcon(zoomOutContainer, "out");
        zoomOutContainer.select("svg")
            .style("margin-top", "0.2em")
            .style("margin-left", "0.2em")
            ;

        container.append("input")
            .attr("type", "button")
            .attr("value", "Aa")
            .style("width", "1.9em")
            .style("font-size", "1.5em")
            .style("height", "1.4em")
            .style("padding-top", ".1em")
            .on("click", () => { editor.pnDraw.showLabels = !editor.pnDraw.showLabels; })

        this.toggleSwitchRunEdit = new ToggleSwitch(container, "Edit", "Run");
        this.toggleSwitchRunEdit.selectors.label
            .style("font-size", "1.5em")
            .style("height", "1.4em")
            ;
    }
}
