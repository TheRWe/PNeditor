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
const d3 = require("d3");
const p = require("./Helpers/Purify");
const Editor_1 = require("./Editor/Editor");
window.addEventListener('load', main);
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        p.fileExample();
        let data = [10, 50, 100];
        let svg = d3.select("svg"), width = +svg.attr("width"), height = +svg.attr("height");
        const editor = new Editor_1.PNEditor(svg);
        /*
        function updateData(data: number[])
        {
            let selector = svg.selectAll("circle").data(data);
    
            //enter
            selector
                .enter()
                .append("circle")
                .attr("r", 10)
               //.merge(selector) // update + enter
                //.transition()
                .attr("cx", function (d: number) { return d; })
                .attr("cy", function (d: number) { return d; });
    
            //update(pouze co už byly přidané)
            selector
                .transition()
                .attr("cx", function (d: number) { return d; })
                .attr("cy", function (d: number) { return d; });
    
        }
    
        updateData(data);
        await sleep(5000);
        data.push(150);
        data[0] = 75;
        console.log(data);
        updateData(data);
        */
    });
}
//# sourceMappingURL=main.js.map