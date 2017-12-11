import { Lisp, flattenPairToIdx } from "./language";
declare function postMessage(message: any): void;

addEventListener("message", (evt) => {
    const prog: Lisp.Pair = JSON.parse(evt.data);
    const flat = flattenPairToIdx(prog);
    
    const info: Lisp.Info = {
        callback: (a, b) => {
            if (typeof(b) === "function") {
                if (b.name) {
                    b = b.name;
                } else {
                    b = "Lambda";
                }
            }
            
            postMessage(JSON.stringify([flat.get(a), b]));
        }
    };

    Lisp.evallisp(prog, Lisp.defaultContext, info);
    
    close();
});