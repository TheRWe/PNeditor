import { d3BaseSelector } from "../../../../definitions/Constants";
import { PNEditor, editorMode } from "../../PNEditor";
import { ToggleSwitch } from "../../../components/ToggleSwitch";
import { MakeZoomInOutIcon } from "../../../../CORE/Helpers/purify";


export class PNDrawControls {
    public readonly toggleSwitchRunEdit: ToggleSwitch;

    constructor(container: d3BaseSelector, editor: PNEditor) {
        container
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
            .on("click", () => {
                if ((editor as any).mode.selected === editorMode.arcMake)
                    (editor as any).mouseEndArc();
                editor.pnAction.Undo(); editor.pnDraw.update();
            });

        container.append("input")
            .attr("type", "button")
            .attr("value", "⇨")
            .style("width", "1.5em")
            .style("font-size", "1.5em")
            .style("height", "1.4em")
            .style("padding-top", ".1em")
            .on("click", () => {
                if ((editor as any).mode.selected === editorMode.arcMake)
                    (editor as any).mouseEndArc();
                editor.pnAction.Redo(); editor.pnDraw.update();
            });

        container.append("input")
            .attr("type", "button")
            .attr("value", "🖶")
            .style("width", "1.5em")
            .style("font-size", "1.5em")
            .style("height", "1.4em")
            .style("padding-top", ".1em")
            .on("click", () => {
                const svg = editor.pnDraw.container
                    .classed("print", true)
                    .style("border", "none")
                    ;

                const scale = editor.pnDraw.scale;
                editor.pnDraw.scale = 1;
                editor.resetState();

                window.print();
                editor.pnDraw.scale = scale;
                svg.style("border", "1px lightgray solid");
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
            .on("click", () => { editor.pnDraw.showLabels = !editor.pnDraw.showLabels; });

        this.toggleSwitchRunEdit = new ToggleSwitch(container, "Edit", "Run");
        this.toggleSwitchRunEdit.selectors.label
            .style("font-size", "1.5em")
            .style("height", "1.4em")
            ;
    }
}
