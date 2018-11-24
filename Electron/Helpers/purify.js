"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const file = require("fs");
function SortKeySelector(fncSelector) {
    function f(a, b) {
        const valA = fncSelector(a);
        const valB = fncSelector(b);
        return valA > valB ? 1 : valA === valB ? 0 : -1;
    }
    return f;
}
exports.SortKeySelector = SortKeySelector;
class Ref {
    constructor(get, set) {
        this.get = get;
        this.set = set;
    }
    get value() {
        return this.get();
    }
    set value(newValue) {
        this.set(newValue);
    }
}
exports.Ref = Ref;
/** returns null as specified type - helper for declaring types in anonymous classes */
function typpedNull() {
    return null;
}
exports.typpedNull = typpedNull;
function flatten(arr) {
    return Array.prototype.concat(...arr);
}
exports.flatten = flatten;
//todo: named tuple(univerzálně ne jenom bool)
function classify(srr, ...fncs) {
    return srr.map(x => ({ element: x, classifications: fncs.map(f => f(x)) }));
}
exports.classify = classify;
//todo: testování
function readObjectFromFileSync(path) {
    try {
        let objString = file.readFileSync(path, { encoding: "utf8" });
        const obj = JSON.parse(objString);
        const typedObj = {};
        return Object.assign(typedObj, obj);
    }
    catch (_a) {
        return null;
    }
}
exports.readObjectFromFileSync = readObjectFromFileSync;
//todo: testování
function writeObjectToFileSync(path, obj) {
    try {
        file.writeFileSync(path, JSON.stringify(obj), { encoding: "utf8" });
    }
    catch (_a) {
        return false;
    }
    return true;
}
exports.writeObjectToFileSync = writeObjectToFileSync;
//todo: async
function fileExample() {
    const fileName = "settings.json";
    let sett = {
        autosave: true,
        dafults: [1, 2, 100]
    };
    file.writeFile(fileName, JSON.stringify(sett), (err) => { if (err)
        console.error("error writing data"); });
    sleep(10000);
    file.readFile(fileName, { encoding: "utf8" }, (err, data) => {
        if (err)
            console.error('failed to read');
        else
            console.log(data);
    });
}
exports.fileExample = fileExample;
function sleep(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        yield _sleep(ms);
    });
}
exports.sleep = sleep;
function _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
//# sourceMappingURL=purify.js.map