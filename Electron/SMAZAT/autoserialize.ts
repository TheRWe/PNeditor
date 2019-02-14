/////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////PNET/////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////
/*
public GetAllElements() {
    return [
        { type: Transition, data: this.transitions },
        { type: Place, data: this.places },
        { type: Arc, data: this.arcs },
    ];
}
*/

/////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////EDITOR///////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////
/*
console.debug(this.net.GetAllElements());

const elms = this.net.GetAllElements().map(x => { return { type: { type: x.type, name: (x.type as any).name as string }, data: (x.data as any[]).map((data, id) => { return { id, data } }) }; });

let jsonSerialized = {} as any;

// todo: co když je subitem iterable
for (const elm of elms) {
    console.debug(elm);
    let vals = [];
    for (const inst in new (elm.type.type as Class)()) {
        vals.push(inst);
    }
    console.debug(vals);

    let items = [];
    for (const item of elm.data) {
        const itemid = item.id,
            itemdata = item.data;
        let jsonItem = { id: itemid };

        for (const propname of vals) {
            if (!itemdata[propname])
                continue;
            const propType = (itemdata[propname] as any).constructor.name;
            if (elms.map(x => x.type.name).filter(x => x === propType).length === 1) {
                //todo: find ID
            }
            //todo: push id as `id_${propname}`
        }

        items.push(jsonItem);
    }

    jsonSerialized[(elm.type as any).name as string] = items
}

console.debug({ serialized: jsonSerialized });
*/