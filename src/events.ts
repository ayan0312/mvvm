import { isFunction } from './utilities'

export type EventEmitterCallback<T = any> = {
    (value?: T): void
    originFunction?: EventEmitterCallback<T>
}

export class EventEmitter<Scope = any> {
    private readonly _events: Map<string, EventEmitterCallback[]>
    private readonly _scope?: Scope

    constructor(scope?: Scope) {
        this._events = new Map<string, EventEmitterCallback[]>()
        if (scope) this._scope = scope
    }

    public on<T>(eventName: string, callback: EventEmitterCallback<T>): void {
        if (!this._events.has(eventName)) this._events.set(eventName, [])
        this._events.get(eventName).push(callback)
    }

    public emit<T>(eventName: string, value?: T): void {
        if (!this._events.has(eventName)) return
        this._events.get(eventName).forEach((callback) => {
            if (isFunction(callback)) {
                if (this._scope) callback.call(this._scope, value)
                else callback(value)
            }
        })
    }

    public off<T>(eventName: string, callback?: EventEmitterCallback<T>): void {
        if (callback) {
            this._events.set(
                eventName,
                this._events.get(eventName).filter((cb) => {
                    if (cb === callback || cb.originFunction === callback)
                        return false
                })
            )
        } else {
            this._events.delete(eventName)
        }
    }

    public once<T>(
        eventName: string,
        callback?: EventEmitterCallback<T>
    ): void {
        const self = this
        const onceCallback = function () {
            self.off(eventName, onceCallback)
            callback.apply(self, arguments)
        }
        onceCallback.originFunction = callback
        this.on(eventName, onceCallback)
    }
}
