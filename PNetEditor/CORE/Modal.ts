
export enum modalResult { X, btn0, btn1, btn2, btn3 }
/** Function that opens modals with given button labels and returns clicked button. */
export async function showModal(message: string, btn0: string = null, btn1: string = null, btn2: string = null, btn3: string = null) {
    const modalElm = document.querySelector("#modal");
    const messageElm = document.querySelector(".js-modal-message");

    const btnWithCallbacks: { callback?: () => void, result: modalResult, element: Element, text: string | null }[] = [
        { element: document.querySelector("#modal-button-X"), result: modalResult.X, text: "X" },
        { element: document.querySelector("#modal-button-0"), result: modalResult.btn0, text: btn0 },
        { element: document.querySelector("#modal-button-1"), result: modalResult.btn1, text: btn1 },
        { element: document.querySelector("#modal-button-2"), result: modalResult.btn2, text: btn2 },
        { element: document.querySelector("#modal-button-3"), result: modalResult.btn3, text: btn3 },
    ];

    messageElm.textContent = message;

    modalElm.classList.add("modal-show");

    const result = await new Promise<modalResult>((resolve) => {
        btnWithCallbacks.forEach(x => {
            if (x.text) {
                x.callback = () => { resolve(x.result) };
                x.element.addEventListener("click", x.callback);
                x.element.textContent = x.text;
                x.element.classList.remove("hidden");
            }
            else
                x.element.classList.add("hidden");
        });
    });

    btnWithCallbacks.forEach(x => {
        if (x.text) { x.element.removeEventListener("click", x.callback); }
        x.element.textContent = "";
    });

    modalElm.classList.remove("modal-show");

    return result;
}
