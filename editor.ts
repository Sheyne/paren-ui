import { PairView, AttributedPair } from "./display";
import { flattenIdxToPair, toString, Lisp } from "./language";

function makePair(): AttributedPair {
    return { name: "" };
}

function hasArgs(pair: AttributedPair): pair is AttributedPair & { args: AttributedPair[] } {
    return !!pair.args;
}

function addParentConnections(parent: AttributedPair) {
    if (hasArgs(parent)) {
        for (const element of parent.args) {
            element.parent = parent;
            if (element.args) {
                addParentConnections(element);
            }
        }
    }
}

function uglyCodeToInvokeWorkers(editor: EditorView) {
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
}

export class EditorView {
    map: Map<AttributedPair, PairView> = new Map();

    container = document.createElement("div");
    root: AttributedPair = { "name": "" };
    active: AttributedPair | undefined = this.root;
    selection: number | undefined = undefined;

    onedit?: () => void;
    ondraw?: () => void;

    constructor(program: Lisp.Pair) {
        this.container.tabIndex = 0;
        this.container.addEventListener("keydown", (e)=>{
            this.onkeydown(e);
        });
        this.container.addEventListener("keypress", (e)=>{
            this.onkeypress(e);
        });
        this.container.addEventListener("focus", (e)=>{
            if (this.active === undefined) {
                this.active = this.root;
                this.draw();
            }
        });
        this.container.addEventListener("blur", (e)=>{
            this.active = undefined;
            this.draw();
        });
        this.program = program;
        uglyCodeToInvokeWorkers(this);
    }

    set program(prog: AttributedPair) {
        addParentConnections(prog);
        this.root = prog;
    }

    draw() {
        this.map.clear();
        const startNode = new PairView(this.root, this);
        this.container.innerHTML = "";
        this.container.appendChild(startNode.table);
        if (this.ondraw) {
            this.ondraw();
        }
    }

    constrainSelection() {
        if (!this.active) return;
        if (this.selection !== undefined) {
            if (this.selection > this.active.name.length) {
                this.selection = this.active.name.length;
            }
        }
    }

    onkeydown(e: KeyboardEvent) {
        if (!this.active) return;
        if (e.keyCode == 37) {
            this.constrainSelection();
            if (this.selection !== undefined) {
                if (this.selection === 0) {
                    this.left();
                    this.selection = undefined;
                } else {
                    this.selection -= 1;
                }
            } else {
                this.left();
            }
            e.preventDefault();
        }
        if (e.keyCode == 38) {
            this.up();
            e.preventDefault();
        }
        if (e.key === "b" && e.ctrlKey && e.altKey) {
            this.active.horizontal = !this.active.horizontal;
            e.preventDefault();
        }
        if (e.keyCode == 39) {
            this.constrainSelection();
            if (this.selection !== undefined) {
                this.selection += 1;
                if (this.selection === this.active.name.length + 1) {
                    this.selection = undefined;
                    this.right();
                }
            } else {
                this.right();
            }
            e.preventDefault();
        }
        if (e.keyCode == 40) {
            this.down();
            e.preventDefault();
        }
        if (e.keyCode === 8) {
            // delete
            e.preventDefault();
            this.constrainSelection();
            if (this.active.name === "") {
                const parent = this.active.parent;
                if (parent) {
                    var idx = (parent.args!).indexOf(this.active);
                    parent.args.splice(idx, 1);
                    if (parent.args.length === 0) {
                        this.active = parent;
                        (parent as AttributedPair).args = undefined;
                    } else {
                        this.active = parent.args![Math.max(0, idx - 1)];
                    }
                }
                this.selection = undefined;
            } else {
                if (this.selection !== undefined) {
                    if (this.selection) {
                        this.active.name = this.active.name.substring(0, this.selection - 1) + this.active.name.substring(this.selection);
                        this.selection -= 1;
                    }
                } else {
                    this.active.name = "";
                }
            }
            if (this.onedit !== undefined) {
                this.onedit();
            }
        }
        this.draw();
    }

    up() {
        if (!this.active) return;
        var p = this.active.parent;
        if (p) {
            var idx = p.args.indexOf(this.active);
            this.active = p.args![Math.max(idx - 1, 0)];
        }
    }
    down() {
        if (!this.active) return;
        var p = this.active.parent;
        if (p) {
            var idx = p.args.indexOf(this.active);
            this.active = p.args![Math.min(idx + 1, p.args.length - 1)];
        }
    }
    left() {
        if (!this.active) return;
        if (this.active.parent) {
            this.active = this.active.parent;
        }
    }
    right() {
        if (!this.active) return;
        if (this.active.args && this.active.args[0]) {
            this.active = this.active.args[0];
        }
    }

    addCellBelow() {
        if (!this.active) return;
        const parent = this.active.parent;
        if (parent) {
            var index = parent.args.indexOf(this.active);
            var newElement = makePair();
            newElement.parent = this.active.parent;
            parent.args.splice(index + 1, 0, newElement);
            this.active = newElement;
            this.selection = undefined;
        }
    }

    onkeypress(e: KeyboardEvent) {
        if (!this.active) return;
        if (e.keyCode == 40) {
            // open paren
            if (this.active.args) {
                this.active = this.active.args[0];
            } else {
                var newElement = makePair();
                this.active.args = [newElement];
                if (hasArgs(this.active)) {
                    newElement.parent = this.active;
                }
                this.active = newElement;
            }
            this.selection = undefined;
        } else if (e.keyCode == 44) {
            // ,
            this.addCellBelow();
        } else if (e.keyCode == 13) {
            if (this.selection === undefined) {
                this.selection = this.active.name.length;
            } else {
                this.addCellBelow();
            }
        } else if (e.keyCode == 8) {
            // delete
            return;
        } else if (e.keyCode === 27) {
            this.selection = undefined;
        } else if (e.key === "b" && e.altKey) {
            return;
        } else {
            this.constrainSelection();
            if (this.selection === undefined) {
                this.active.name = String.fromCharCode(e.keyCode);
                this.selection = 1;
            } else {
                this.active.name = this.active.name.slice(0, this.selection) +
                    String.fromCharCode(e.keyCode) +
                    this.active.name.slice(this.selection);
                this.selection += 1;
            }
        }
        if (this.onedit !== undefined) {
            this.onedit();
        }
        this.draw();
    }
}