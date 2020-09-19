import { RemoveAll } from "./Helpers/purify";

export class Graph<VT, ET>{
    public nodes: GraphNode<VT>[] = [];
    public connections: { from: GraphNode<VT>, to: GraphNode<VT>, data?: ET }[] = [];

    private _getConnectionIndex(from: GraphNode<VT>, to: GraphNode<VT>) {
        return this.connections.findIndex(x => x.to === to && x.from === from);
    }

    public CreateNode(data?: VT): GraphNode<VT> {
        const node = new GraphNode<VT>(data);
        this.nodes.push(node);
        return node;
    }

    public Connect(from: GraphNode<VT>, to: GraphNode<VT>, data?: ET) {
        if (this._getConnectionIndex(from, to) >= 0) return;
        this.connections.push({ from, to, data });
    }


    public Disconnect(from: GraphNode<VT>, to: GraphNode<VT>) {
        const cons = this.connections;
        const index = this._getConnectionIndex(from, to);
        if (index === -1) return;
        this.connections.splice(index, 1);
    }

    /** removes all connections going FROM given node */
    public DisconnectFrom(node: GraphNode<VT>) {
        RemoveAll(this.connections, x => x.from === node);
    }

    /** removes all connections going TO given node */
    public DisconnectTo(node: GraphNode<VT>) {
        RemoveAll(this.connections, x => x.to === node);
    }

    /** removes all connections with this node */
    public DisconnectAll(node: GraphNode<VT>) {
        RemoveAll(this.connections, x => x.to === node || x.from === node);
    }

    /** Disconnect node and remove it from graph */
    public Remove(node: GraphNode<VT>) {
        if (this.nodes.findIndex(x => x === node) === -1) return;
        this.DisconnectAll(node);
        this.nodes.splice(this.nodes.findIndex(x => x === node), 1);
    }

    public GetConnectionData(from: GraphNode<VT>, to: GraphNode<VT>): ET | undefined {
        return (this.connections.find(x => x.to === to && x.from === from) || {} as any).data;
    }

    /** returns all nodes accessible from this */
    public GetFrom(node: GraphNode<VT>) {
        return this.connections.filter(x => x.from === node).map(x => x.to);
    }

    /** returns all nodes from which is this node accessible */
    public GetTo(node: GraphNode<VT>) {
        return this.connections.filter(x => x.to === node).map(x => x.from);
    }

    /** returns all nodes TRANSITIVELY accessible from this - including this */
    public GetTransitiveFrom(node: GraphNode<VT>) {
        const nodes: GraphNode<VT>[] = [];

        const rec = (n: GraphNode<VT>) => {
            if (nodes.findIndex(x => x === n) >= 0) return;
            nodes.push(n);
            this.connections.filter(x => x.from === n).forEach(x => rec(x.to));
        };
        rec(node);

        return nodes;
    }

    /** returns all nodes TRANSITIVELY from which is this node accessible - including this */
    public GetTransitiveTo(node: GraphNode<VT>) {
        const nodes: GraphNode<VT>[] = [];

        const rec = (n: GraphNode<VT>) => {
            if (nodes.findIndex(x => x === n) >= 0) return;
            nodes.push(n);
            this.connections.filter(x => x.to === n).forEach(x => rec(x.from));
        };
        rec(node);

        return nodes;
    }

    /** copies connection from one node to second */
    public CopyConnections(copyFrom: GraphNode<VT>, copyTo: GraphNode<VT>, edgeMergerFnc: (copyFromData: ET, copyToData: ET) => ET) {
        const c = this.connections;

        c.filter(x => x.from === copyFrom).forEach(x => {
            const _from = copyTo, _to = x.to;
            this.Connect(_from, _to);
            this.connections.find(y => y.from === _from && y.to === _to).data = edgeMergerFnc(x.data, this.GetConnectionData(_from, _to));
        });
        c.filter(x => x.from === copyFrom).forEach(x => {
            const _from = x.from, _to = copyTo;
            this.Connect(_from, _to);
            this.connections.find(y => y.from === _from && y.to === _to).data = edgeMergerFnc(x.data, this.GetConnectionData(_from, _to));
        });
    }
}


export class GraphNode<T>{
    public data: T;

    constructor(data?: T) {
        this.data = data;
    }
}
