class PNet {
    constructor() {
        this.Places = [];
        this.Transformations = [];
        //this.SVG = new SVG(300, 300);
        //this.SVG.HTMLElement.addEventListener("mousedown", e =>
        //{
        //    // 0 left, 1 middle, 2 right
        //    if (e.button !== 0) return;
        //    let p: Place = new Place(this, this.SVG);
        //    p.svg.position.x = e.offsetX;
        //    p.svg.position.y = e.offsetY;
        //    e.stopPropagation();
        //});
    }
    //public readonly SVG: SVG;
    toString() {
        //todo: https://github.com/dsherret/ts-nameof
        let ignore = [];
        return JSON.stringify(this, (key, value) => { return ignore.indexOf(key) !== -1 ? undefined : value; });
    }
    static fromString(str) {
        const obj = JSON.parse(str);
        const net = new PNet();
        return Object.assign(net, obj);
    }
    ArcMode(_fromElm) {
    }
}
PNet.mode = "normal";
class Place /*implements SVGObjectProvider*/ {
    constructor(pnet /*, svg: SVG*/, id = undefined, name = undefined) {
        this.parentPNet = pnet;
        //this.svg = svg.DrawCircle(10);
        this.name = name;
        //this.svg.svgElement.addEventListener("mousedown", e =>
        //    {
        //        //this.parentPNet.
        //        e.stopPropagation();
        //    });
        this.id = id;
    }
}
//# sourceMappingURL=PNet.js.map