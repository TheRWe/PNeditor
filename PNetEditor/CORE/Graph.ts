import { RemoveAll } from "../Helpers/purify";

export class Graph<T>{
    public allNodes: GraphNode<T>[] = [];

    public CreateNode(data?: T): GraphNode<T> {
        const node = new GraphNode<T>(data);
        this.allNodes.push(node);
        return node;
    }

    public Connect(from: GraphNode<T>, to: GraphNode<T>) {
        if (from.ConnectedTo.findIndex(x => x === to) >= 0) return;
        from.ConnectedTo.push(to);
        to.ConnectedFrom.push(from);
    }


    public Disconnect(from: GraphNode<T>, to: GraphNode<T>) {
        RemoveAll(from.ConnectedTo, e => e === to);
        RemoveAll(to.ConnectedFrom, e => e === from);
    }

    public DisconnectFrom(node: GraphNode<T>) {
        let n: GraphNode<T> | undefined;
        while (n = node.ConnectedFrom.pop())
            n.ConnectedTo.splice(n.ConnectedTo.findIndex(x => x === node), 1);
    }

    public DisconnectTo(node: GraphNode<T>) {
        let n: GraphNode<T> | undefined;
        while (n = node.ConnectedTo.pop())
            n.ConnectedFrom.splice(n.ConnectedFrom.findIndex(x => x === node), 1);
    }

    public DisconnectAll(node: GraphNode<T>) {
        this.DisconnectTo(node);
        this.DisconnectFrom(node);
    }

    public Remove(node: GraphNode<T>) {
        this.DisconnectAll(node);
        this.allNodes.splice(this.allNodes.findIndex(x => x === node), 1);
    }

    /** returns all nodes accessible from this - including this */
    public GetAllAccessibleFrom(node: GraphNode<T>) {
        const nodes: GraphNode<T>[] = [];

        const rec = (n: GraphNode<T>) => {
            if (nodes.findIndex(x => x === n) >= 0) return;
            nodes.push(n);
            n.ConnectedTo.forEach(x => rec(x));
        }
        rec(node);

        return nodes;
    }

    /** returns all nodes from which is this node accessible - including this */
    public GetAllAccessibleTo(node: GraphNode<T>) {
        const nodes: GraphNode<T>[] = [];

        const rec = (n: GraphNode<T>) => {
            if (nodes.findIndex(x => x === n) >= 0) return;
            nodes.push(n);
            n.ConnectedFrom.forEach(x => rec(x));
        }
        rec(node);

        return nodes;
    }

    /** copies connection from one node to second */
    public CopyConnections(from: GraphNode<T>, to: GraphNode<T>) {
        from.ConnectedFrom.forEach(x => this.Connect(x,to))
        from.ConnectedTo.forEach(x => this.Connect(to,x))
    }
}


export class GraphNode<T>{
    public data: T;

    public ConnectedTo: GraphNode<T>[] = [];
    public ConnectedFrom: GraphNode<T>[] = [];

    constructor(data?: T) {
        this.data = data;
    }
}
