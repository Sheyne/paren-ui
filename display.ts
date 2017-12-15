import { EditorView } from "./editor";
import { Lisp } from "./language";

export interface AttributedPair {
    name: string;
    args?: AttributedPair[];
    horizontal?: boolean;
    parent?: AttributedPair & { args: AttributedPair[] };
}

export class PairView {
    public table: HTMLTableElement = document.createElement("table");
    public row: HTMLTableRowElement = document.createElement("tr");
    public head: HTMLDivElement = document.createElement("td");
    public value: HTMLDivElement = document.createElement("td");
    public args?: HTMLTableCellElement | HTMLTableRowElement;

    constructor(func: AttributedPair, editor: EditorView) {
        editor.map.set(func, this);
        this.row.appendChild(this.head);
        this.row.appendChild(this.value);
        this.table.appendChild(this.row);
        this.value.classList.add("value-cell");

        this.table.addEventListener("click", (e) => {
            editor.active = func;
            editor.selection = undefined;
            e.stopPropagation();
            editor.draw();
        });

        this.head.innerHTML = func.name;

        if (func === editor.active) {
            if (editor.selection === undefined) {
                this.table.style.backgroundColor = "#aaf";
            } else {
                this.head.innerHTML = func.name.slice(0, editor.selection) +
                    "<span id='cursor'></span>" +
                    func.name.slice(editor.selection);
            }
        }
        if (func.args !== undefined) {
            let horizontal = true;
            let containsActive = false;
            for (const f of func.args) {
                if (f.args !== undefined) {
                    horizontal = false;
                }
                if (f === editor.active) {
                    containsActive = true;
                }
            }

            horizontal = (func.horizontal === true || horizontal) && !containsActive;
            this.toFunction();

            for (const f of func.args) {
                this.add(new PairView(f, editor), horizontal);
            }
        }
    }

    public toFunction() {
        this.args = document.createElement("td");
        this.row.appendChild(this.args);
        this.args.classList.add("args");
        this.row.appendChild(this.value);
    }

    public add(child: PairView, horiz: boolean) {
        let toAdd: HTMLTableElement | HTMLTableCellElement = child.table;
        if (horiz) {
            const cell = document.createElement("td");
            cell.classList.add("horiz-component");
            cell.appendChild(child.table);
            toAdd = cell;
        }
        if (this.args === undefined) {
            throw new Error("invariant violated");
        }
        this.args.appendChild(toAdd);
    }
}
