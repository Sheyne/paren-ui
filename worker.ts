import { Lisp } from "./language";
import { close } from "inspector";

addEventListener("message", (evt) => {
    const prog: Lisp.Pair = evt.data;
    const flat: Map<Lisp.Pair, number> = new Map();
    function traversal(prog: Lisp.Pair, flat: Map<Lisp.Pair, number>, idx: number[]) {
        flat.set(prog, idx[0]);
        idx[0]++;
        if (!prog.args) {
            return;
        }
        for (const func of prog.args) {
            traversal(func, flat, idx);
        }
    }

    traversal(prog, flat, [0]);

    const info: Lisp.Info = {
        callback: (a, b) => {
            if (typeof(b) === "function") {
                if (b.name) {
                    b = "Lambda: " + b.name;
                } else {
                    b = "Lambda";
                }
            }
            postMessage([flat.get(a), b], "*");
        }
    };

    Lisp.evallisp(prog, Lisp.defaultContext, info);
    
    close();
});