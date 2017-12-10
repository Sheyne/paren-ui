import { Lisp } from "./language";
import { program as program1 } from "./program1";

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

traversal(program1, flat, [0]);

const info: Lisp.Info = {
    callback: (a, b) => {
        console.log(flat.get(a), b);
    }
};

Lisp.evallisp(program1, Lisp.defaultContext, info);

console.log(flat);

