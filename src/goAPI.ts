export declare class GoClass {
    run(instance: any): Promise<any>
    importObject: Record<string, Record<string, WebAssembly.ImportValue>>
}

export declare class GoEventEmitter {
    constructor(scope: any)
    on: (eventName: string, cb: (value: any) => void) => boolean
    emit: (eventName: string, value: any) => boolean
    once: (eventName: string, cb: (value: any) => void) => boolean
}

export const Go: typeof GoClass = window['Go']
