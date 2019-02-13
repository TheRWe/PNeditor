import * as d3 from 'd3';
import * as p from './Helpers/Purify';
import { PNEditor as PNE } from './Editor/Editor';
import { ipcRenderer } from 'electron';

window.addEventListener('load', main);


async function main()
{
    p.fileExample();

    let data = [10, 50, 100];

    let div = d3.select(".editor");
    const editor = new PNE(div);

    ipcRenderer.on('load PNet', (e: any, msg: any) => {
        if (msg.path) 
            editor.Load(msg.path);
    })
    ipcRenderer.on('save PNet', (e: any, msg: any) => {
        if (msg)
            editor.Save(msg.path);
    })
    ipcRenderer.on("new PNet", (e: any, msg: any) => {
        console.log("new net");
        //todo: msg -> typ sítě atd...
        editor.NewNet();
    })

    ipcRenderer.on('quick-load PNet', (e: any) => {
        editor.AutoLoad();
    })
    ipcRenderer.on('quick-save PNet', (e: any) => {
        editor.AutoSave();
    })


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
    updateData(data);
    */

}

