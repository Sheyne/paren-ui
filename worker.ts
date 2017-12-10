import { Lisp, flattenPairToIdx } from "./language";
declare function postMessage(message: any): void;

addEventListener("message", (evt) => {
    const prog: Lisp.Pair = evt.data;
    const flat = flattenPairToIdx(prog);
    
    const info: Lisp.Info = {
        callback: (a, b) => {
            if (typeof(b) === "function") {
                if (b.name) {
                    b = "Lambda: " + b.name;
                } else {
                    b = "Lambda";
                }
            }
            
            postMessage([flat.get(a), b]);
        }
    };

    Lisp.evallisp(prog, Lisp.defaultContext, info);
    
    close();
});