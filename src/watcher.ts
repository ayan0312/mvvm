import { Dep, ID } from 'src/dep'
import { DataType, DataKey, MVVM, getVMVal } from 'src/mvvm'
import { hasOwn, isFunction } from 'src/utilities'

export type WatcherCallback = (newValue?: DataType, oldValue?: DataType) => void

export type Getter = (obj: MVVM) => MVVM
export type WatcherMethod = DataKey | Getter

export function parseGetter(exp: string): (vm: MVVM) => DataType {
    if (/[^\w.$]/.test(exp)) return
    return (vm: MVVM): DataType => getVMVal(vm, exp)
}

/**
 *
 */
export class Watcher {
    public cb: WatcherCallback
    public vm: MVVM
    public expOrFn: WatcherMethod
    public depIds: Record<ID, Dep>
    public getter: Getter
    public value: DataType

    constructor(vm: MVVM, expOrFn: WatcherMethod, cb: WatcherCallback) {
        this.cb = cb
        this.vm = vm
        this.expOrFn = expOrFn
        this.depIds = {}

        if (isFunction(expOrFn)) this.getter = expOrFn
        else this.getter = parseGetter(expOrFn.trim())

        this.value = this.get()
    }

    public update(): void {
        let newValue = this.get()
        let oldVal = this.value
        if (newValue !== oldVal) {
            this.value = newValue
            this.cb.call(this.vm, newValue, oldVal)
        }
    }

    public addDep(dep: Dep): void {
        if (!hasOwn(this.depIds, dep.id)) {
            dep.addSub(this)
            this.depIds[dep.id] = dep
        }
    }

    public get(): DataType {
        Dep.target = this
        let value: DataType = this.getter.call(this.vm, this.vm)
        Dep.target = null
        return value
    }
}
