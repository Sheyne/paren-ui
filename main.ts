import { EditorView } from "./editor";
import { flattenIdxToPair, toString, Lisp } from "./language";

const editor = new EditorView();
editor.program = {"name":"letrec","args":[{"name":"inc","args":[{"name":"lambda","args":[{"name":"","args":[{"name":"x"}]},{"name":"+","args":[{"name":"x"},{"name":"1"}]}]}]},{"name":"sum","args":[{"name":"lambda","args":[{"name":"","args":[{"name":"low"},{"name":"high"},{"name":"func"},{"name":"accum"}]},{"name":"if","args":[{"name":">","args":[{"name":"low"},{"name":"high"}]},{"name":"accum"},{"name":"sum", "args":[{"name":"inc","args":[{"name":"low"}]},{"name":"high"},{"name":"func"},{"name":"+","args":[{"name":"accum"},{"name":"func","args":[{"name":"low"}]}]}]}]}]}]},{"name":"sum","args":[{"name":"1"},{"name":"3"},{"name":"lambda","args":[{"name":"","args":[{"name":"x"}]},{"name":"*","args":[{"name":"x"},{"name":"x"}]}]},{"name":"0"}]}]};
editor.draw();

window.addEventListener("keypress", (e)=>editor.onkeypress(e));
window.addEventListener("keydown", (e)=>editor.onkeydown(e));

window.document.getElementById("container")!.appendChild(editor.container);

let prevWorker: Worker | undefined = undefined;
const cachedResults = new Map<number, Lisp.Result>();

function isDeadResult(x: Lisp.Result): x is Lisp.DeadResult {
    return !!((x as any).message);
}

function redrawValues() {
    const flat = flattenIdxToPair(editor.root);
    for (let [idx, value] of cachedResults) {
        const pair = flat.get(idx);
        if (! pair) {
            console.log("wierd behavior 737162");
            continue;
        }
        const view = editor.map.get(pair);
        if (! view) {
            console.log("wierd behavior 37482");
            continue;
        }
        if (isDeadResult(value)) {
            view.table.classList.add("dead-result");
            value = "Error: " + value.message;
        }
        view.value.innerHTML = ""+value;
    }
}

editor.ondraw = ()=>{
    redrawValues();
}

editor.onedit = ()=>{
    if (prevWorker) {
        prevWorker.terminate();
    }
    document.getElementById("code")!.innerHTML = "processing";
    const testWorker = new Worker('worker-starter.js?4');
    prevWorker = testWorker;
    cachedResults.clear();
    testWorker.addEventListener("message", function(msg) {
        let [idx, value] = JSON.parse(msg.data);
        cachedResults.set(idx, value);
        redrawValues();
    });
    const codeString = toString(editor.root);
    testWorker.postMessage(codeString);
    document.getElementById("code")!.innerHTML = codeString;
};
editor.onedit();