import { EditorView } from "./editor";

const setupAnimation = (editor: EditorView, steps: Array<"exitEditMode" | "right" | "down" | "up" | "left" | ["type", string]>) => {
    let animationStep = 0;
    const interval = setInterval(() => {
        const step = steps[animationStep % steps.length];
        const arrows = editor.container.parentElement!.getElementsByClassName("arrows")[0] as HTMLElement;
        arrows.classList.remove("material-icons");
        if (Array.isArray(step)) {
            editor.type(step[1]);
            arrows.innerHTML = step[1];
        } else {
            editor[step]();
            if (step === "left" || step === "right" || step === "up" || step === "down") {
                arrows.classList.add("material-icons");
                arrows.innerHTML = "keyboard_arrow_" + step;
            } else if (step === "exitEditMode") {
                arrows.innerHTML = "ESC";
            }
        }
        arrows.style.color = "black";
        setTimeout(() => {
            arrows.style.color = "#aaa";
        }, 200);
        if (editor.onedit !== undefined) {
            editor.onedit();
        }
        editor.draw();
        animationStep += 1;
    }, 1000);
    editor.container.addEventListener("focus", (e) => {
        clearInterval(interval);
        window.document.getElementById("container-arrowkey-arrows")!.innerHTML = "";
    });
    editor.active = editor.root;
    editor.draw();
};

{
    const editor = new EditorView({ args: [{ args: [{ name: "1" }], name: "a" }, { args: [{ args: [{ name: "1" }, { name: "2" }], name: "+" }], name: "b" }, { name: "a" }], name: "letrec" });
    window.document.getElementById("container-arrowkey")!.appendChild(editor.container);
    setupAnimation(editor, [["type", "l"], ["type", "e"], ["type", "t"], ["type", "r"], ["type", "e"], ["type", "c"], "exitEditMode", "right", "down", "down", "up", "right", "right", "left", "left", "left"]);
}

const editor1 = new EditorView({ name: "+", args: [{ name: "1" }, { name: "5" }, { name: "2" }] });
const editor2 = new EditorView({
    name: "letrec",
    args: [
        { name: "C", args: [{ name: "4" }] },
        {
            name: "f", args: [
                {
                    name: "lambda", args: [
                        { name: "", args: [{ name: "x" }] },
                        { name: "+", args: [{ name: "x" }, { name: "C" }] },
                    ],
                }],
        },
        { name: "f", args: [{ name: "7" }] },
    ],
});

const program = { name: "letrec", args: [{ name: "inc", args: [{ name: "lambda", args: [{ name: "", args: [{ name: "x" }] }, { name: "+", args: [{ name: "x" }, { name: "1" }] }] }] }, { name: "sum", args: [{ name: "lambda", args: [{ name: "", args: [{ name: "low" }, { name: "high" }, { name: "func" }, { name: "accum" }] }, { name: "if", args: [{ name: ">", args: [{ name: "low" }, { name: "high" }] }, { name: "accum" }, { name: "sum", args: [{ name: "inc", args: [{ name: "low" }] }, { name: "high" }, { name: "func" }, { name: "+", args: [{ name: "accum" }, { name: "func", args: [{ name: "low" }] }] }] }] }] }] }, { name: "sum", args: [{ name: "1" }, { name: "3" }, { name: "lambda", args: [{ name: "", args: [{ name: "x" }] }, { name: "*", args: [{ name: "x" }, { name: "x" }] }] }, { name: "0" }] }] };
const editor3 = new EditorView(program);
const editor4 = new EditorView({
    name: "index", args: [
        { name: "list", args: [{ name: "1" }, { name: "2" }, { name: "5" }] },
        { name: "2" },
    ],
});
const editor5 = new EditorView({ args: [{ name: "'hello " }, { args: [{ args: [{ name: "1" }, { name: "2" }], name: "+" }], name: "->string" }], name: "concat" });
editor1.draw();
editor2.draw();
editor3.draw();
editor4.draw();
editor5.draw();
window.document.getElementById("container1")!.appendChild(editor1.container);
window.document.getElementById("container2")!.appendChild(editor2.container);
window.document.getElementById("container3")!.appendChild(editor3.container);
window.document.getElementById("container4")!.appendChild(editor4.container);
window.document.getElementById("container5")!.appendChild(editor5.container);
