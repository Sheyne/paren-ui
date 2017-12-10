import { Lisp } from "./language";
import { EditorView } from "./editor";

export type AttributedPair = {
    name: string;
    args?: AttributedPair[];
    horizontal? : boolean;
    parent?: AttributedPair & {args: AttributedPair[]};
};

export class PairView {
    table: HTMLTableElement = document.createElement("table");
    row : HTMLTableRowElement = document.createElement("tr");
    head: HTMLTableCellElement = document.createElement("td");
    args?: HTMLTableCellElement | HTMLTableRowElement;

    constructor(func: AttributedPair, editor: EditorView) {
        editor.map.set(func, this);    
        this.row.appendChild(this.head);
        this.table.appendChild(this.row);  
        
        this.table.addEventListener("click", function(e) {
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
                this.head.innerHTML = func.name.slice(0, editor.selection) + "<span id='cursor'></span>" + func.name.slice(editor.selection)
            }
        }
        if (func.args) {
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
    
            horizontal = (func.horizontal || horizontal) && !containsActive;
            this.toFunction();
    
            for (const f of func.args) {
                this.add(new PairView(f, editor), horizontal);
            }
        }
    }

    toFunction() {
        this.args = document.createElement("td");
        this.row.appendChild(this.args);
        this.args.classList.add("args");
    }

    add(child: PairView, horiz: boolean) {
        let toAdd : HTMLTableElement | HTMLTableCellElement = child.table;
        if (horiz) {
            const cell = document.createElement("td");
            cell.classList.add("horiz-component");
            cell.appendChild(child.table);
            toAdd = cell;
        }
        if (!this.args) {
            throw new Error("invariant violated");
        }
        this.args.appendChild(toAdd);
    }
}