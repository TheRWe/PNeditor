         
const controlbarMainRunToggleDiv = controlbarMain.append("div")
    .classed("onoffswitch", true)
    .style("display", "inline-block");
        
controlbarMainRunToggleDiv.append("input")
    .attr("type", "checkbox")
    .attr("name", "onoffswitch")
    .classed("onoffswitch-checkbox", true)
    .attr("id", "myonoffswitch")
    .on("change", this.mouse.controlBar.main.runToggle.onChange);

const controlbarMainRunToggleLabel = controlbarMainRunToggleDiv.append("label")
    .classed("onoffswitch-label", true)
    .attr("for", "myonoffswitch");

controlbarMainRunToggleLabel.append("span")
    .classed("onoffswitch-inner", true);
            
controlbarMainRunToggleLabel.append("span")
    .classed("onoffswitch-switch", true);



/* todo: univerzálnost */
/* z https://proto.io/freebies/onoff/ */
// CSS
/*

.onoffswitch {
    position: relative;
    width: 65px;
    -webkit - user - select: none;
    -moz - user - select: none;
    -ms - user - select: none;
}

.onoffswitch - checkbox {
    display: none;
}

.onoffswitch - label {
    display: block;
    overflow: hidden;
    cursor: pointer;
    border: 2px solid #999999;
    border - radius: 24px;
}

.onoffswitch - inner {
    display: block;
    width: 200 %;
    margin - left: -100 %;
    transition: margin 0.3s ease -in 0s;
}

.onoffswitch - inner: before, .onoffswitch - inner: after {
    display: block;
    float: left;
    width: 50 %;
    height: 18px;
    padding: 0;
    line - height: 18px;
    font - size: 13px;
    color: white;
    font - family: Trebuchet, Arial, sans - serif;
    font - weight: bold;
    box - sizing: border - box;
}

.onoffswitch - inner: before {
    content: "Run";
    padding - left: 8px;
    background - color: #FF0000;
    color: #FFFFFF;
}

.onoffswitch - inner: after {
    content: "Edit";
    padding - right: 8px;
    background - color: #2E8DEF;
    color: #FFFFFF;
    text - align: right;
}

.onoffswitch -switch {
    display: block;
    width: 23px;
    margin: -2.5px;
    background: #000000;
    position: absolute;
    top: 0;
    bottom: 0;
    right: 43px;
    border: 2px solid #999999;
    border-radius: 24px;
    transition: all 0.3s ease-in 0s;
}

    .onoffswitch - checkbox:checked + .onoffswitch - label.onoffswitch - inner {
    margin - left: 0;
}

.onoffswitch - checkbox: checked + .onoffswitch - label.onoffswitch -switch {
    right: 0px;
}

*/