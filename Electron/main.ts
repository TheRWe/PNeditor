import * as d3 from 'd3';
import * as file from 'fs';
import * as p from './Helpers/Purify';
import * as PNE from './Editor/Editor';
import { sleep } from './Helpers/Purify';

window.addEventListener('load', main);


async function main()
{
    p.fileExample();

    let data = [10, 50, 100];

    let svg = d3.select("svg"),
        width = +svg.attr("width"),
        height = +svg.attr("height");

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
    await sleep(2000);
    data.push(150);
    data[0] = 75;
    console.log(data);
    updateData(data);

}

