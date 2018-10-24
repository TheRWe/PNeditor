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
window.addEventListener('load', main);
function sleep(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        yield _sleep(ms);
    });
}
function _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        let data = [10, 50, 100];
        let svg = d3.select("svg"), width = +svg.attr("width"), height = +svg.attr("height");
        function updateData(data) {
            let selector = svg.selectAll("circle").data(data);
            //enter
            selector
                .enter()
                .append("circle")
                .attr("r", 10)
                //.merge(selector) // update + enter
                //.transition()
                .attr("cx", function (d) { return d; })
                .attr("cy", function (d) { return d; });
            //update(pouze co už byly přidané)
            selector
                .transition()
                .attr("cx", function (d) { return d; })
                .attr("cy", function (d) { return d; });
        }
        updateData(data);
        yield sleep(2000);
        data.push(150);
        data[0] = 75;
        console.log(data);
        updateData(data);
    });
}
//# sourceMappingURL=main.js.map