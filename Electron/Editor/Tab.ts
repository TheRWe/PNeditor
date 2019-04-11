import { PNet, Place, Transition } from "./PNet";
import { typedNull } from "../Helpers/purify";
import { d3BaseSelector } from "./Constants";


// todo: generika

export class TabControl<TabDataType> {
    private readonly html = {
        selectors: {
            tabs: typedNull<d3BaseSelector>(),
            content: typedNull<d3BaseSelector>(),
        }
    }

    private tabs = [] as { data: TabDataType, name: string }[]

    public get CurrentTab(): TabDataType {
        const tab = this.tabs[this.selected]
        return tab === undefined ? null : tab.data;
    }

    public get SelectedIndex(): number {
        return this.selected;
    }
    public set SelectedIndex(tabIndex: number) {
        if (this.selected === tabIndex)
            return;

        if (this.selected > this.tabs.length - 1)
            this.selected = this.tabs.length - 1;
        else
            this.selected = tabIndex;

        this.Update();
        this.onSelectionChanged()
    }


    private selected = -1;

    // todo: custom eventy
    private onSelectionChanged = () => { }
    public AddOnSelectionChanged(listener: () => void) {
        const onSelectionChanged = this.onSelectionChanged;
        this.onSelectionChanged = () => {
            onSelectionChanged();
            listener();
        }
    }

    private onTabAddButton = () => { }
    public AddOnTabAddButton(listener: () => void) {
        const onTabAddButton = this.onTabAddButton;
        this.onTabAddButton = () => {
            onTabAddButton();
            listener();
        }
    }

    public AddTab(tabData: TabDataType, name: string = "unnamed", selectAddedTab = true) {
        this.tabs.push({ data: tabData, name });

        if (selectAddedTab)
            this.SelectedIndex = this.tabs.length - 1;
        console.debug({ indx: this.selected, tab: this.CurrentTab });

    }

    public CloseTabAtIndex(index: number) {
        this.tabs.splice(index, 1);
        // ensuring deleted tab isn't selected
        this.SelectedIndex = this.SelectedIndex;
    }

    public CloseTab(tabData: TabDataType) {
        this.CloseTabAtIndex(this.tabs.findIndex(x => x.data === tabData));
    }


    private Update() {
        const selector = () => {
            return this.html.selectors.tabs
                .selectAll("li")
                .data(this.tabs);
        }

        const liEnter = selector().enter().append("li")
            .style("float", "left")
            .style("display", "inline-block")
            .style("vertical-align", "top")
            .style("list-style-type", "none");

        const radioEnter = liEnter.append("input")
            .attr("type", "radio")
            .attr("name", "tab-net")
            .attr("id", (d, i) => `tab-${i}`)
            .classed("checkbox-tab-radio", true)
            .style("margin", "0")
            .on("change", (d, i) => {
                this.SelectedIndex = i;
            });

        const labelEnter = liEnter.append("label")
            .attr("for", (d, i) => `tab-${i}`)
            .style("padding", "8px")
            .style("user-select", "none")
            .style("display", "inline-block");

        // todo: static length ?
        const labelDivEnter = labelEnter.append("div")
            .style("all", "unset");

        const buttonEnter = labelEnter.append("button")
            .attr("type", "button")
            .on("click", (d, i) => { this.CloseTabAtIndex(i); })
            .style("border", "0")
            .style("border-style", "none")
            .style("background", "none")
            .style("color", "white")
            .text("X");


        const li = selector()
            .select("label div")
            .text(x => x.name);

        const radio = selector()
            .select("input")
            .property("checked", (x, i) => i === this.SelectedIndex);

        selector().exit().remove();
    }

    constructor(divElement: d3BaseSelector) {
        const tabs = this.html.selectors.tabs = divElement.append("ul")
            .style("padding", 0)
            .style("clear", "both")
            .style("display", "inline-block")
            .style("background", "black")
            .style("width", "100%")
            .style("margin", "0");

        tabs.append("button")
            .attr("type", "button")
            .on("click", () => { this.onTabAddButton(); })
            .style("border", "0")
            .style("border-style", "none")
            .style("background", "none")
            .style("float", "right")
            .style("color", "white")
            .style("font-size", "20px")
            .style("padding", "5px 9px 5px 9px")
            .style("user-select", "none")
            .text("+");
    }
}
