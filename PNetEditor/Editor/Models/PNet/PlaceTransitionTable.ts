import { d3BaseSelector } from "../../../CORE/Constants";
import { JSONNet } from "./PNModel";
import { DrawBase, Callbacks } from "../_Basic/DrawBase";

type placeMarking = { id: number, marking: number };
type marking = placeMarking[];
type netConfiguration = { marking: placeMarking[], enabledTransitions: number[] }

export type ConfigTransitionClickEvent = { configIndex: number, transitionID: number };
export type ConfigShowClickEvent = { configIndex: number};

export class PlaceTransitionTable extends DrawBase {
    public models = {
        net: null as JSONNet,
        configurations: [] as netConfiguration[],
    };
    public Callbacks = {
        container: new Callbacks<{}>(),
    };
    protected Selectors = {
        table: null as d3BaseSelector,
    };
    // todo: v nastavení bude velikost textu tabulky
    protected _update(): void {
        const table = this.Selectors.table;
        const net = this.models.net;
        const configs = this.models.configurations;

        table.html("");

        const placeIndexes = net.places.map(x => x.id);
        const transitionIndexes = net.transitions.map(x => x.id);

        const head = table.append("tr");

        head.append("th").text("");

        placeIndexes.forEach(x => {
            const p = net.places.find(y => y.id === x);
            head.append("th").text(p.id).style("min-width","1em");
        })

        head.append("th").style("background", "black");


        transitionIndexes.forEach(x => {
            const t = net.transitions.find(y => y.id === x);
            head.append("th").text(t.id).style("width","1.2em");
        })

        configs.forEach((c,ci) => {
            const row = table.append("tr");

            const showbutton = row.append("td");
            showbutton
                .text("👁")
                .style("font-weight", "bold")
                .style("background", "white")
                .style("cursor", "pointer")
                .classed("unselectable", true)
                .on("mouseover", () => { showbutton.style("filter", "invert(1)") })
                .on("mouseout", () => { showbutton.style("filter", "") })
                .on("click", () => { this._onConfigShowClick({ configIndex: ci }); });

            placeIndexes.forEach(x => {
                const m = c.marking.find(y => y.id === x);
                row.append("td").text(m ? m.marking : 0);
            })

            row.append("td").style("background", "black");


            transitionIndexes.forEach(x => {
                const enabled = c.enabledTransitions.some(y => y === x);
                row.append("td")
                    .style("background", enabled ? "green" : "lightgray")
                    .style("cursor", enabled ? "pointer" : "not-allowed")
                    .on("click", enabled ? () => { this._onConfigTransitionClick({ configIndex: ci, transitionID:x }); } : () => { })
                    .classed("unselectable", true)
                    .classed("bright-on-hover", enabled ? true : false)
                    ;
            })

        });
    }

    private _onConfigTransitionClick: (e: ConfigTransitionClickEvent) => void = () => { };
    public AddOnConfigTransitionClick(callback: (e: ConfigTransitionClickEvent) => void) {
        const old = this._onConfigTransitionClick; this._onConfigTransitionClick = (...args) => { old(...args); callback(...args); };
    }

    private _onConfigShowClick: (e: ConfigShowClickEvent) => void = () => { };
    public AddOnConfigShowClick(callback: (e: ConfigShowClickEvent) => void) {
        const old = this._onConfigShowClick; this._onConfigShowClick = (...args) => { old(...args); callback(...args); };
    }

    constructor(container: d3BaseSelector) {
        super(container);

        const table = this.Selectors.table = container.append("table");

        table
            .style("font-size", "1.1em")
            .classed("table-gray", true)
            ;

        this.AddOnConfigTransitionClick((e) => { console.debug(`Table transition clicked cfgIndex:${e.configIndex} tIndex:${e.transitionID}`); });
        this.AddOnConfigShowClick((e) => { console.debug(`Table config show clicked cfgIndex:${e.configIndex}`); });
    }
}
