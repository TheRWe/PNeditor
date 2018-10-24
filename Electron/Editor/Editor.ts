export class PNEditor
{
    private net: PNet;

    public get element(): Element 
    {
        //return this.net.SVG.HTMLElement;
        //todo: implementace
        return null;
    }

    constructor(){
        this.net = new PNet();

        //var svg = this.net.SVG;

    }
}