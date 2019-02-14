import * as Sett from "./EditorHelpers/SettingsInterface"
// todo: vymyslet rozumné propojení pro případné uživatelské nastavení nebo editor
export const sett: Sett.Settings =
{
    modes: {
        main: ["default", "arc-make"],
        // todo: pokročilé dependencies - and/or a podobně
        // todo: second name
        // todo: initial value
        // todo: save state
        // todo: multistate toggle ???
        toggles: [
        "Run",
        {
            name: "Delete",
            dependencies: {
                toggles: [{ name: "Run", value: false }]
            }
        },]
    },
    actions: [
    ]
}