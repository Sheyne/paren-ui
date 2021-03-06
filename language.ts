export namespace Lisp {
    export interface Pair {
        name: string;
        args?: Pair[];
    }

    interface Context {
        parentContext: Context | undefined;
        members: {
            [key: string]: Result | undefined;
        };
    }

    interface ResultArray {
        [n: number]: Result | ResultArray;
    }

    export type Result = string | number | boolean | ResultArray | Lambda | DeadResult;
    export interface Info {
        callback?: (token: Pair, result: Result) => void;
    }
    interface Lambda {
        (args: Pair[], context: Context, info: Info): Result;
        numArgs?: number;
        funcName?: string;
        name?: string;
    }

    export class DeadResult {
        constructor(public message: string) {
        }
    }

    const list: Lambda = (args, context, info) => {
        const res: Result[] = [];
        for (const e of args) {
            const v = evallisp(e, context, info);
            if (v instanceof DeadResult) {
                return v;
            }
            res.push(v);
        }
        return res;
    };

    const exprToString: Lambda = (args, context, info) => {
        if (args.length !== 1) {
            return new DeadResult("->string needs exactly 1 argument");
        }
        const a = evallisp(args[0], context, info);

        return "" + a;
    };
    exprToString.funcName = "->string";
    exprToString.numArgs = 1;

    const index: Lambda = (args, context, info) => {
        if (args.length !== 2) {
            return new DeadResult("index needs exactly two arguments");
        }
        const a = evallisp(args[0], context, info);
        if (a instanceof DeadResult) {
            return a;
        }
        if (typeof (a) !== "object" || !Array.isArray(a)) {
            return new DeadResult("0th argument must be a list");
        }
        const b = evalnumber(args[1], context, info, "index");
        if (b instanceof DeadResult) {
            return b;
        }
        if (a[b] === undefined) {
            return new DeadResult(b + " not in range");
        }
        return a[b];
    };

    index.numArgs = 2;

    const concat: Lambda = (args, context, info) => {
        let res = "";
        for (const e of args) {
            const v = evallisp(e, context, info);
            if (v instanceof DeadResult) {
                return v;
            }
            if (typeof (v) !== "string") {
                return new DeadResult("can only concat strings");
            }
            res += v;
        }
        return res;
    };

    const plus: Lambda = (args, context, info) => {
        let res = 0;
        for (const e of args) {
            const v = evalnumber(e, context, info, "add");
            if (v instanceof DeadResult) {
                return v;
            }
            res += v;
        }
        return res;
    };

    const evalnumber = (e: Pair, context: Context, info: Info, message: string) => {
        const v = evallisp(e, context, info);
        if (v instanceof DeadResult) {
            return v;
        }
        if (typeof (v) !== "number") {
            return new DeadResult("can only '" + message + "' numbers");
        }
        return v;
    };

    const lessthan: Lambda = (args, context, info) => {
        return binaryMath((a, b) => {
            return a < b;
        }, args, context, info, "<");
    };

    lessthan.numArgs = 2;

    const greaterthan: Lambda = (args, context, info) => {
        return binaryMath((a, b) => {
            return a > b;
        }, args, context, info, ">");
    };

    greaterthan.numArgs = 2;

    const equalto: Lambda = (args, context, info) => {
        return binaryMath((a, b) => {
            return a === b;
        }, args, context, info, "=");
    };

    equalto.numArgs = 2;

    const minus: Lambda = (args, context, info) => {
        return binaryMath((a, b) => {
            return a - b;
        }, args, context, info, "-");
    };

    minus.numArgs = 2;

    const divide: Lambda = (args, context, info) => {
        return binaryMath((a, b) => {
            return a / b;
        }, args, context, info, "/");
    };

    divide.numArgs = 2;

    const binaryMath = (op: (a: number, b: number) => number | boolean,
                        args: Pair[],
                        context: Context,
                        info: Info,
                        name: string) => {
        const res = 0;
        if (args.length !== 2) {
            return new DeadResult(name + " needs exactly two arguments");
        }
        const a = evalnumber(args[0], context, info, name);
        const b = evalnumber(args[1], context, info, name);
        if (a instanceof DeadResult) {
            return a;
        }
        if (b instanceof DeadResult) {
            return b;
        }
        return op(a, b);
    };

    const times: Lambda = (args, context, info) => {
        let res = 1;
        for (const e of args) {
            const v = evalnumber(e, context, info, "multiply");
            if (v instanceof DeadResult) {
                return v;
            }
            res *= v;
        }
        return res;
    };

    const iff: Lambda = (args, context, info) => {
        const v = evallisp(args[0], context, info);
        if (v instanceof DeadResult) {
            return v;
        }
        if (v !== true && v !== false) {
            return new DeadResult("argument to if must be boolean");
        }
        if (v) {
            return evallisp(args[1], context, info);
        } else {
            return evallisp(args[2], context, info);
        }
    };

    iff.numArgs = 3;

    const letrec: Lambda = (args, context, info) => {
        const newContext: Context = {
            parentContext: context,
            members: {},
        };
        for (const arg of args.slice(0, args.length - 1)) {
            if (arg.args === undefined) {
                return new DeadResult("binding '" + arg.name + "' must have a body");
            }
            newContext.members[arg.name] = evallisp(arg.args[0], newContext, info);
        }
        return evallisp(args[args.length - 1], newContext, info);
    };

    const lambda: Lambda = (outerArgs, outerContext, info) => {
        const argNames: string[] = [];
        const [arg1, arg2] = outerArgs;

        if (arg1.args === undefined) {
            return new DeadResult("the first argument to a lambda must have arguments");
        }

        for (const name of arg1.args) {
            argNames.push(name.name);
        }

        const lambdaFunc: Lambda = (args, context, info) => {
            const newContext: Context = { parentContext: context, members: {} };
            for (let i = 0; i < argNames.length; i++) {
                newContext.members[argNames[i]] = evallisp(args[i], context, info);
            }
            return evallisp(arg2, newContext, info);
        };

        lambdaFunc.numArgs = argNames.length;

        return lambdaFunc;
    };

    lambda.numArgs = 2;

    const calllisp = (func: Result, args: Pair[], context: Context, info: Info) => {
        if (func instanceof DeadResult) {
            return func;
        } else if (typeof (func) !== "function") {
            return new DeadResult("calling a non-function");
        } else if (func.numArgs !== undefined && func.numArgs !== args.length) {
            return new DeadResult("arity error");
        } else {
            return func(args, context, info);
        }
    };

    const evalf = (args: Pair[], context: Context, info: Info) => {
        const func = evallisp(args[0], context, info);
        return calllisp(func, args.slice(1), context, info);
    };

    export const defaultContext = {
        parentContext: undefined,
        members: {
            "false": false,
            "true": true,
            "+": plus,
            "*": times,
            "<": lessthan,
            ">": greaterthan,
            "=": equalto,
            "-": minus,
            "/": divide,
            "if": iff,
            "lambda": lambda,
            "𝜆": lambda,
            "eval": evalf,
            "letrec": letrec,
            "concat": concat,
            "list": list,
            "index": index,
            "->string": exprToString,
        },
    };

    const lookup = (name: string, context: Context, info: Info) => {
        let maybeContext: Context | undefined = context;
        while (maybeContext !== undefined) {
            const ctx = maybeContext.members[name];
            if (ctx !== undefined) {
                return ctx;
            }
            maybeContext = maybeContext.parentContext;
        }
        return new DeadResult("variable '" + name + "' not found");
    };

    export const evallisp = (el: Pair, context: Context, info: Info): Result => {
        let res: Result;
        if (el.args === undefined) {
            if (el.name === "") {
                res = "";
            } else if (el.name[0] === "'") {
                res = el.name.slice(1);
            } else if (!isNaN(Number(el.name))) {
                res = Number(el.name);
            } else {
                res = lookup(el.name, context, info);
            }
        } else {
            res = lookup(el.name, context, info);
            res = calllisp(res, el.args, context, info);
        }
        if (info.callback !== undefined) {
            info.callback(el, res);
        }
        return res;
    };
}

const traversal = (prog: Lisp.Pair, flat: (pair: Lisp.Pair, idx: number) => void, idx: number[]) => {
    flat(prog, idx[0]);
    idx[0]++;
    if (prog.args === undefined) {
        return;
    }
    for (const func of prog.args) {
        traversal(func, flat, idx);
    }
};

export const flattenPairToIdx = (prog: Lisp.Pair): Map<Lisp.Pair, number> => {
    const flat: Map<Lisp.Pair, number> = new Map();
    traversal(prog, (a, b) => flat.set(a, b), [0]);
    return flat;
};
export const flattenIdxToPair = (prog: Lisp.Pair): Map<number, Lisp.Pair> => {
    const flat: Map<number, Lisp.Pair> = new Map();
    traversal(prog, (a, b) => flat.set(b, a), [0]);
    return flat;
};

export const toString = (prog: Lisp.Pair): string => {
    return JSON.stringify(prog, ["args", "name"]);
};

export const fromString = (prog: string): Lisp.Pair => {
    return JSON.parse(prog);
    // TODO: any kind of validation that prog is well-formed
};
