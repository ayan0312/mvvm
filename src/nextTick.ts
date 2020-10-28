export type MacroTaskFucntion = {
    (): void
    _withTask?: Function
}

export namespace EventLoop {
    const callbacks: Function[] = []
    const p = Promise.resolve()

    let pending = false
    let useMacroTask = false

    export function flushCallbacks(): void {
        pending = false
        const copies = callbacks.slice(0)
        callbacks.length = 0
        copies.forEach((fn) => fn())
    }

    const macroTimerFunction = () => {
        setTimeout(flushCallbacks, 0)
    }

    const microTimerFunction = () => {
        p.then(flushCallbacks)
    }

    export function withMacroTask<T extends MacroTaskFucntion>(
        fn: T
    ): Function {
        return (
            fn._withTask ||
            (fn._withTask = function () {
                useMacroTask = true
                const res = fn.apply(null, arguments)
                useMacroTask = false
                return res
            })
        )
    }

    export function nextTick(): Promise<void>
    export function nextTick<T>(context: T): Promise<T>
    export function nextTick<T, R extends Function = () => void>(
        context: T,
        callback: R
    ): void
    export function nextTick<T, R extends Function = () => void>(
        context?: T,
        callback?: R
    ): Promise<T> | void {
        let _resolve: undefined | ((value?: T) => void)
        callbacks.push(() => {
            if (callback) callback.call(context)
            else if (_resolve) _resolve(context)
        })
        if (!pending) {
            pending = true
            if (useMacroTask) macroTimerFunction()
            else microTimerFunction()
        }
        if (!callback)
            return new Promise((resolve) => {
                _resolve = resolve
            })
    }
}
