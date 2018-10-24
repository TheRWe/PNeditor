class PNet
{
    static mode: "normal" | "arc" = "normal";

    //todo: vlastní typy
    public Places: Place[];
    public Transformations: Transformation[];
    //public readonly SVG: SVG;

    public toString():string
    {
        //todo: https://github.com/dsherret/ts-nameof
        let ignore: string[] = [];
        return JSON.stringify(this, (key, value) => { return ignore.indexOf(key) !== -1 ? undefined : value });
    }

    public static fromString(str: string): PNet
    {
        const obj = JSON.parse(str);
        const net = new PNet();
        return Object.assign(net, obj);
    }

    public ArcMode(_fromElm: Place)
    {

    }

    constructor()
    {
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
}

type Transformation = { place: Place, qty: number, /*svg: SVGObject*/ }[]

class Place /*implements SVGObjectProvider*/
{
    public name: string | undefined;
    //public svg: SVGObject;
    public id: number | undefined;
    public readonly parentPNet: PNet;

    constructor(pnet:PNet/*, svg: SVG*/, id: number | undefined = undefined, name: string | undefined = undefined)
    {
        this.parentPNet = pnet
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