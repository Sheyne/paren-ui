import { EditorView } from "./editor";

const program = { name: "letrec", args: [{ name: "inc", args: [{ name: "lambda", args: [{ name: "", args: [{ name: "x" }] }, { name: "+", args: [{ name: "x" }, { name: "1" }] }] }] }, { name: "sum", args: [{ name: "lambda", args: [{ name: "", args: [{ name: "low" }, { name: "high" }, { name: "func" }, { name: "accum" }] }, { name: "if", args: [{ name: ">", args: [{ name: "low" }, { name: "high" }] }, { name: "accum" }, { name: "sum", args: [{ name: "inc", args: [{ name: "low" }] }, { name: "high" }, { name: "func" }, { name: "+", args: [{ name: "accum" }, { name: "func", args: [{ name: "low" }] }] }] }] }] }] }, { name: "sum", args: [{ name: "1" }, { name: "3" }, { name: "lambda", args: [{ name: "", args: [{ name: "x" }] }, { name: "*", args: [{ name: "x" }, { name: "x" }] }] }, { name: "0" }] }] };
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
