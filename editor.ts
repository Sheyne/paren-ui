import { AttributedPair, PairView } from "./display";
import { flattenIdxToPair, fromString, Lisp, toString } from "./language";

function makePair(): AttributedPair {
    return { name: "" };
}

function hasArgs(pair: AttributedPair): pair is AttributedPair & { args: AttributedPair[] } {
    return pair.args !== undefined;
}

function addParentConnections(parent: AttributedPair) {
    if (hasArgs(parent)) {
        for (const element of parent.args) {
            element.parent = parent;
            if (element.args !== undefined) {
                addParentConnections(element);
            }
        }
    }
}

function uglyCodeToInvokeWorkers(editor: EditorView) {
    let prevWorker: Worker | undefined;
    const cachedResults = new Map<number, Lisp.Result>();

    function isDeadResult(x: Lisp.Result): x is Lisp.DeadResult {
        return typeof (x) === "object" && x !== null && !!((x as any).message);
    }

    function redrawValues() {
        const flat = flattenIdxToPair(editor.root);
        for (let [idx, value] of cachedResults) {
            const pair = flat.get(idx);
            if (pair === undefined) {
                console.log("wierd behavior 737162");
                continue;
            }
            const view = editor.map.get(pair);
            if (view === undefined) {
                console.log("wierd behavior 37482");
                continue;
            }
            if (isDeadResult(value)) {
                view.table.classList.add("dead-result");
                value = "Error: " + value.message;
            }
            view.value.innerHTML = "" + value;
        }
    }

    editor.ondraw = () => {
        redrawValues();
    };

    editor.onedit = () => {
        if (prevWorker !== undefined) {
            prevWorker.terminate();
        }
        const testWorker = new Worker("worker-starter.js?5");
        prevWorker = testWorker;
        cachedResults.clear();
        testWorker.addEventListener("message", (msg) => {
            const [idx, value] = JSON.parse(msg.data);
            cachedResults.set(idx, value);
            redrawValues();
        });
        const codeString = toString(editor.root);
        testWorker.postMessage(codeString);
    };
    editor.onedit();
}

export class EditorView {
    public map: Map<AttributedPair, PairView> = new Map();

    public container = document.createElement("div");
    public root: AttributedPair = { name: "" };
    public active: AttributedPair | undefined = this.root;
    public selection: number | undefined = undefined;

    public onedit?: () => void;
    public ondraw?: () => void;

    constructor(program: Lisp.Pair) {
        this.container.tabIndex = 0;
        this.container.addEventListener("keydown", (e) => {
            this.onkeydown(e);
        });
        this.container.addEventListener("keypress", (e) => {
            this.onkeypress(e);
        });
        this.container.addEventListener("copy", (e) => {
            this.oncopy(e);
        });
        this.container.addEventListener("cut", (e) => {
            this.oncut(e);
        });
        this.container.addEventListener("paste", (e) => {
            this.onpaste(e);
        });

        this.container.addEventListener("focus", (e) => {
            if (this.active === undefined) {
                this.active = this.root;
                this.draw();
            }
        });
        this.container.addEventListener("blur", (e) => {
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

    public draw() {
        this.map.clear();
        const startNode = new PairView(this.root, this);
        this.container.innerHTML = "";
        this.container.appendChild(startNode.table);
        if (this.ondraw !== undefined) {
            this.ondraw();
        }
    }

    public constrainSelection() {
        if (this.active === undefined) { return; }
        if (this.selection !== undefined) {
            if (this.selection > this.active.name.length) {
                this.selection = this.active.name.length;
            }
        }
    }

    public onpaste(e: ClipboardEvent): void {
        const pair = fromString(e.clipboardData.getData("text/plain"));
        if (this.active !== undefined) {
            if (this.selection === undefined) {
                this.active.name = pair.name;
                this.active.args = pair.args;
            } else {
                const name = this.active.name;
                this.active.name = name.slice(0, this.selection) + pair.name + name.slice(this.selection);
                this.selection += pair.name.length;
                this.active.args = pair.args;
            }

            addParentConnections(this.active);

            if (this.onedit !== undefined) {
                this.onedit();
            }
            this.draw();
        }
        e.preventDefault();
    }

    public oncopy(e: ClipboardEvent): void {
        if (this.active !== undefined) {
            e.clipboardData.setData("text/plain", toString(this.active));
        }
        e.preventDefault();
    }

    public oncut(e: ClipboardEvent): void {
        if (this.active !== undefined) {
            e.clipboardData.setData("text/plain", toString(this.active));
            if (this.active.parent !== undefined) {
                this.active.parent.args.splice(this.active.parent.args.indexOf(this.active), 1);
                if (this.active.parent.args.length === 0) {
                    (this.active.parent as AttributedPair).args = undefined;
                }
            }

            if (this.onedit !== undefined) {
                this.onedit();
            }
            this.draw();
        }
        e.preventDefault();
    }

    public onkeydown(e: KeyboardEvent) {
        if (this.active === undefined) { return; }
        if (e.key === "b" && e.ctrlKey && e.altKey) {
            this.active.horizontal = this.active.horizontal !== true;
            e.preventDefault();
        }
        if (e.metaKey || e.metaKey || e.altKey || e.ctrlKey) {
            return;
        }
        if (e.keyCode === 37) {
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
        if (e.keyCode === 38) {
            this.up();
            e.preventDefault();
        }
        if (e.keyCode === 39) {
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
        if (e.keyCode === 40) {
            this.down();
            e.preventDefault();
        }
        if (e.keyCode === 8) {
            // delete
            e.preventDefault();
            this.constrainSelection();
            if (this.selection !== undefined) {
                if (this.selection !== 0) {
                    this.active.name = this.active.name.substring(0, this.selection - 1) +
                        this.active.name.substring(this.selection);
                    this.selection -= 1;
                } else {
                    const parent = this.active.parent;
                    if (parent !== undefined) {
                        const index = parent.args.indexOf(this.active);
                        if (index > 0) {
                            const newActive = parent.args[index - 1];
                            if (newActive.args !== undefined) {
                                this.selection = undefined;
                                this.active = newActive.args[0];
                            } else {
                                const oldActive = this.active;
                                newActive.args = oldActive.args;
                                this.selection = newActive.name.length;
                                newActive.name += oldActive.name;
                                this.active = newActive;
                                parent.args.splice(index, 1);
                            }
                        } else {
                            this.selection = undefined;
                        }
                    }
                }
            } else {
                if (this.active.name !== "") {
                    this.active.name = "";
                } else {
                    const parent = this.active.parent;
                    if (parent !== undefined) {
                        const idx = (parent.args!).indexOf(this.active);
                        parent.args.splice(idx, 1);
                        if (parent.args.length === 0) {
                            this.active = parent;
                            (parent as AttributedPair).args = undefined;
                        } else {
                            this.active = parent.args![Math.max(0, idx - 1)];
                        }
                    }
                    this.selection = undefined;
                }
            }
            if (this.onedit !== undefined) {
                this.onedit();
            }
        }
        this.draw();
    }

    public up() {
        if (this.active === undefined) { return; }
        const p = this.active.parent;
        if (p !== undefined) {
            const idx = p.args.indexOf(this.active);
            this.active = p.args![Math.max(idx - 1, 0)];
        }
    }
    public down() {
        if (this.active === undefined) { return; }
        const p = this.active.parent;
        if (p !== undefined) {
            const idx = p.args.indexOf(this.active);
            this.active = p.args![Math.min(idx + 1, p.args.length - 1)];
        }
    }
    public left() {
        if (this.active === undefined) { return; }
        if (this.active.parent !== undefined) {
            this.active = this.active.parent;
        }
    }
    public right() {
        if (this.active === undefined) { return; }
        if (this.active.args !== undefined && this.active.args[0] !== undefined) {
            this.active = this.active.args[0];
        }
    }

    public addCellNear(element: AttributedPair, offset: 0 | 1) {
        const parent = element.parent;
        if (parent !== undefined) {
            const index = parent.args.indexOf(element);
            const newElement = makePair();
            newElement.parent = parent;
            parent.args.splice(index + offset, 0, newElement);
            return newElement;
        }
    }

    public addCellByCursor() {
        if (this.active === undefined) { return; }
        const newElement = this.addCellNear(this.active, 0);
        if (newElement !== undefined) {
            newElement.name = this.active.name.slice(0, this.selection);
            this.active.name = this.active.name.slice(this.selection);
            this.selection = 0;
        }
    }

    public onkeypress(e: KeyboardEvent) {
        if (this.active === undefined) { return; }
        if (e.metaKey || e.metaKey || e.altKey || e.ctrlKey) {
            return;
        }
        if (e.keyCode === 40) {
            // open paren
            let newElement: AttributedPair | undefined;
            if (this.selection !== undefined) {
                newElement = {
                    name: this.active.name.substring(this.selection),
                    args: this.active.args,
                };
                this.active.name = this.active.name.substring(0, this.selection);
                this.selection = 0;
            } else {
                if (this.active.args !== undefined) {
                    this.active = this.active.args[0];
                } else {
                    newElement = makePair();
                }
            }
            if (newElement !== undefined) {
                this.active.args = [newElement];
                if (hasArgs(this.active)) {
                    newElement.parent = this.active;
                }
                this.active = newElement;
            }
            this.selection = undefined;
        } else if (e.keyCode === 41) {
            this.active = this.addCellNear(this.active, 1);
            this.selection = 0;
        } else if (e.keyCode === 44) {
            // ,
            this.addCellByCursor();
        } else if (e.keyCode === 13) {
            if (this.selection === undefined) {
                this.selection = this.active.name.length;
            } else {
                this.addCellByCursor();
            }
        } else if (e.keyCode === 8) {
            // delete
            return;
        } else if (e.keyCode === 27) {
            this.selection = undefined;
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
