window.addEventListener("load", main, false);
function main() {
    const body = document.getElementsByTagName("body")[0];
    //const Editor = new PNEditor();
    //body.insertBefore(Editor.element, body.firstChild);
    //const net = new PNet();
    //alert(PNet.fromString(net.toString()).toString());
    //const a = new SVG(200, 180);
    //a.DrawLine({ x: 10, y: 10 }, { x: 30, y: 30 });
    //a.DrawCircle(10);
    //a.HTMLElement.addEventListener("click",
    //    (e) =>
    //    {
    //        const c = a.DrawCircle(10);
    //        c.position.x = e.offsetX;
    //        c.position.y = e.offsetY;
    //        //alert(e.offsetX + " " + e.offsetY);
    //    });
    //body.appendChild(a.HTMLElement);
}
function gpuTest(mode = "gpu") {
    const gpu = new GPU({ mode: mode });
    // přidání funkce aby se mohla používat v kernelu
    //function blah(){return 3;}
    //gpu.addFunction(blah)
    const matrixDim = 512;
    const g_Mul = gpu.createKernel(function (a, b) {
        var sum = 0;
        for (var i = 0; i < this.constants.dimension; i++) {
            sum += a[this.thread.y][i] * b[i][this.thread.x];
        }
        return sum;
    }, {
        output: { x: matrixDim, y: matrixDim },
        constants: { dimension: matrixDim }
    });
    const aM = randomMatrix(matrixDim);
    const bM = randomMatrix(matrixDim);
    var perf = performance.now();
    console.info(g_Mul(aM, bM));
    alert(performance.now() - perf);
}
function randomMatrix(n) {
    const mat = [];
    var i;
    for (i = n; i--;) {
        var row = [];
        var j;
        for (j = n; j--;) {
            row.push(Math.random() * 1000);
        }
        mat.push(row);
    }
    return mat;
}
//# sourceMappingURL=script.js.map