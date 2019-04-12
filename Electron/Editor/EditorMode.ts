import { typedNull } from "../Helpers/purify";

export class EditorMode {
    public readonly default: editorMode = editorMode.default;
    private _last: editorMode = editorMode.default;
    private _selected: editorMode = editorMode.default;

    public get selected(): editorMode { return this._selected; }
    public set selected(v: editorMode) {
        const changed = v === this._selected;
        this._last = this._selected;
        this._selected = v;
        if (changed)
            this.onChanged();
    }

    private onChanged = () => { };

    public AddOnChange(callback: () => {}) {
        const onChanged = this.onChanged;

        this.onChanged = () => {
            onChanged();
            callback();
        }
    }

    public get last(): editorMode { return this._last; }
    public swap(): void { this.selected = this.last; }



}

export enum editorMode {
    default = "default",
    arcMake = "arc-make",
    valueEdit = "edit",
    run = "run",
    multiSelect = "multi-select",
}
