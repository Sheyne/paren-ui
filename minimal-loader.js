const modules = {
    require: () => {
        console.log("oh no!");
    }
};
function define(modname, requestedArgs, func) {
    modules[modname] = {};
    const args = [];
    for (const arg of requestedArgs) {
        if (arg === "exports") {
            args.push(modules[modname]);
        } else {
            args.push(modules[arg])
        }
    }
    func.apply(undefined, args);
}
