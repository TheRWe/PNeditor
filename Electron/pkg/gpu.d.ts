//todo: implementace z https://github.com/gpujs/gpu.js
//todo: http://gpujs.github.io/usr-docs/

declare class GPU {
    createKernel<TArgs, TConst extends {}, TOut>(kernel:
        (this: {
            thread: { x: number, y: number, z: number },
            constants: TConst;
        }, ...args: TArgs[]) => TOut,
        paramObj: { constants: TConst, output: { x: number, y: number, z: number } }): (...args: TArgs[]) => TOut[];

    createKernel<TArgs, TConst extends {}, TOut>(kernel:
        (this: {
            thread: { x: number, y: number},
            constants: TConst;
        }, ...args: TArgs[]) => TOut,
        paramObj: { constants: TConst, output: { x: number, y: number} }): (...args: TArgs[]) => TOut[];

    createKernel<TArgs, TConst extends {}, TOut>(kernel:
        (this: {
            thread: { x: number },
            constants: TConst;
        }, ...args: TArgs[]) => TOut,
        paramObj: { constants: TConst, output: { x: number } }): (...args: TArgs[]) => TOut[];

    constructor(sett?: { mode?: string });
}

