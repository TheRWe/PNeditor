import * as Sett from "./EditorHelpers/SettingsInterface"
// todo: vymyslet rozumné propojení pro případné uživatelské nastavení nebo editor
export const sett: Sett.Settings =
{
    modes: {
        main: ["default", "arc-make", "delete"],

        // todo: pokročilé dependencies - and/or a podobně
        // todo: second name Run/Edit (zobrazený pouze jeden podle toho jestli zaškrtnutý)
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
    // todo: when analýza jestli je main validní ... 
        { on: { event: Sett.Events.Click, target: "none" }, when: { main: "default" }, do: [{ type: Sett.Actions.add, element: "transition" }] },
        {
            on: { event: Sett.Events.Click, target: "transition" },
            when: { main: "default" },
            do: [{ type: Sett.Actions.add, element: "transition" }],
            to: { main: "arc-make" }
        },
        {
            on: { event: Sett.Events.Click, target: "none" }, when: { main: "arc-make" }, do: [{ type: Sett.Actions.add, element: "place" }]
        }
    ]
}