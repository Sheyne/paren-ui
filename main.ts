import { EditorView, RIGHT_KEY, DOWN_KEY, UP_KEY, LEFT_KEY, ESC_KEY, DELETE_KEY } from "./editor";



const setupAnimation = (editor: EditorView, stepsOrig: Array<number | string>) => {
    const arrowElement = document.createElement("i");
    editor.container.parentElement!.appendChild(arrowElement);
    editor.container.parentElement!.appendChild(editor.container);
    arrowElement.style.fontSize = "200%";
    const defaultDelay = 800;
    const makeArray = (steps: Array<number | string>): Array<number | {keyCode: number, delay: number}> => {
        const result: Array<number | {keyCode: number, delay: number}> = [];
        for (const step of steps) {
            if (typeof(step) === "number") {
                result.push(step);
            } else {
                if (step === "(") {
                    result.push({keyCode: 40, delay: defaultDelay});
                } else if (step === ")") {
                    result.push({keyCode: 41, delay: defaultDelay});
                } else {
                    for (let i = 0; i < step.length; i ++) {
                        result.push({
                            keyCode: step.charCodeAt(i),
                            delay: i + 1 === step.length ? defaultDelay : 150,
                        });
                    }
                }
            }
        }
        return result;
    };
    let animationStep = 0;
    const steps = makeArray(stepsOrig);
    const loop = () => {
        const step = steps[animationStep % steps.length];
        let keyCode;
        let delay = defaultDelay;
        arrowElement.classList.remove("material-icons");
        if (typeof(step) === "object") {
            keyCode = step.keyCode;
            delay = step.delay;
            arrowElement.innerHTML = String.fromCharCode(keyCode);
        } else {
            keyCode = step;
            if (step === UP_KEY) {
                arrowElement.classList.add("material-icons");
                arrowElement.innerHTML = "arrow_upward"
            }
            if (step === DOWN_KEY) {
                arrowElement.classList.add("material-icons");
                arrowElement.innerHTML = "arrow_downward"
            }
            if (step === RIGHT_KEY) {
                arrowElement.classList.add("material-icons");
                arrowElement.innerHTML = "arrow_forward"
            }
            if (step === LEFT_KEY) {
                arrowElement.classList.add("material-icons");
                arrowElement.innerHTML = "arrow_back"
            }
            if (step === ESC_KEY) {
                arrowElement.innerHTML = "ESC";
            }
            if (step === DELETE_KEY) {
                arrowElement.innerHTML = "DELETE";
            }
        }

        let stop = false;
        const evt: any = {keyCode: keyCode, altKey: false, metaKey: false, shiftKey: false, preventDefault: ()=>{
            stop = true;
        }, ctrlKey: false};
        if (typeof(step) === "number") {
            editor.onkeydown(evt);
        }
        if (! stop) {
            editor.onkeypress(evt);
        }
        arrowElement.style.color = "black";

        setTimeout(() => {
            arrowElement.style.color = "grey";
        }, 75);

        animationStep += 1;
        timeout = setTimeout(loop, delay);
    };
    let timeout = setTimeout(loop, defaultDelay);
    editor.container.addEventListener("focus", (e) => {
        clearTimeout(timeout);
        arrowElement.innerHTML = "";
    });
    editor.active = editor.root;
    editor.draw();
};

{
    const editor = new EditorView({ args: [{ args: [{ name: "1" }], name: "a" }, { args: [{ args: [{ name: "1" }, { name: "2" }], name: "+" }], name: "b" }, { name: "a" }], name: "letrec" });
    window.document.getElementById("container-arrowkey")!.appendChild(editor.container);
    setupAnimation(editor, [RIGHT_KEY, DOWN_KEY, DOWN_KEY, UP_KEY, RIGHT_KEY, RIGHT_KEY, DOWN_KEY, UP_KEY, LEFT_KEY, LEFT_KEY, LEFT_KEY]);
}

{
    const editor = new EditorView({ name: "" });
    window.document.getElementById("container1")!.appendChild(editor.container);
    setupAnimation(editor, [
        "+",
        "(",
        "1",
        ",",
        "2",
        ESC_KEY,
        DELETE_KEY,
        DELETE_KEY,
        DELETE_KEY,
        DELETE_KEY,
    ]);
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
