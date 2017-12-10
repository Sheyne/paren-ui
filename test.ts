import { Lisp } from "./language";
import { program as program1 } from "./program1";

const info = { results: new Map<Lisp.Pair, Lisp.Result>() };
const flat: { [n: number]: Lisp.Result } = {};

console.log(Lisp.evallisp(program1, Lisp.defaultContext, info));

function traversal(prog: Lisp.Pair, info: Lisp.Info, flat: { [n: number]: Lisp.Result }, idx: number[]) {
    const result = info.results.get(prog);
    if (result) {
        flat[idx[0]] = result;
    }
    idx[0]++;
    if (!prog.args) {
        return;
    }
    for (const func of prog.args) {
        traversal(func, info, flat, idx);
    }
}

traversal(program1, info, flat, [0]);

console.log(flat);

