import { PairView, AttributedPair } from "./display";

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

export class EditorView {
    map: Map<AttributedPair, PairView> = new Map();

    container = document.createElement("div");
    private root: AttributedPair = { "name": "" };
    active: AttributedPair = this.root;
    selection: number | undefined = undefined;

    onedit?: () => void;

    set program(prog: AttributedPair) {
        addParentConnections(prog);
        this.root = prog;
    }

    draw() {
        this.map.clear();
        const startNode = new PairView(this.root, this);
        this.container.innerHTML = "";
        this.container.appendChild(startNode.table);
    }

    constrainSelection() {
        if (this.selection !== undefined) {
            if (this.selection > this.active.name.length) {
                this.selection = this.active.name.length;
            }
        }
    }

    onkeydown(e: KeyboardEvent) {
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
        }
        if (this.onedit !== undefined) {
            this.onedit();
        }
        this.draw();
    }

    up() {
        var p = this.active.parent;
        if (p) {
            var idx = p.args.indexOf(this.active);
            this.active = p.args![Math.max(idx - 1, 0)];
        }
    }
    down() {
        var p = this.active.parent;
        if (p) {
            var idx = p.args.indexOf(this.active);
            this.active = p.args![Math.min(idx + 1, p.args.length - 1)];
        }
    }
    left() {
        if (this.active.parent) {
            this.active = this.active.parent;
        }
    }
    right() {
        if (this.active.args && this.active.args[0]) {
            this.active = this.active.args[0];
        }
    }

    addCellBelow() {
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
        } else if (e.keyCode === 27) {
            this.selection = undefined;
        } else if (e.key === "t" && e.ctrlKey) {
            this.active.horizontal = !this.active.horizontal;
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