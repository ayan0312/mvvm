import { Dep, ID } from './dep'
import { DataType, DataKey, MVVM, getVMVal } from './mvvm'
import { hasOwn, isFunction } from './utilities'

export type WatcherCallback = (newValue?: DataType, oldValue?: DataType) => void

export type Getter = (obj: MVVM) => MVVM
export type WatcherMethod = DataKey | Getter

export function parseGetter(exp: string): (vm: MVVM) => DataType {
    return (vm: MVVM): DataType => getVMVal(vm, exp)
}

export class Watcher {
    public readonly callback: WatcherCallback
    public readonly vm: MVVM

    private _depIds: Record<ID, Dep>
    private _getter: Getter

    public value: DataType

    constructor(vm: MVVM, expOrFn: WatcherMethod, callback: WatcherCallback) {
        this.callback = callback
        this.vm = vm
        this._depIds = {}

        if (isFunction(expOrFn)) this._getter = expOrFn
        else this._getter = parseGetter(expOrFn.trim())
        this.value = this.get()
    }

    public update(): void {
        let newValue = this.get()
        let oldVal = this.value
        if (newValue !== oldVal) {
            this.value = newValue
            this.callback.call(this.vm, newValue, oldVal)
        }
    }

    public removeDep(dep: Dep): void {
        delete this._depIds[dep.id]
    }

    public addDep(dep: Dep): void {
        if (!hasOwn(this._depIds, dep.id)) {
            dep.addSub(this)
            this._depIds[dep.id] = dep
        }
    }

    public get(): DataType {
        Dep.target = this
        let value: DataType = this._getter.call(this.vm, this.vm)
        Dep.target = null
        return value
    }
}
