import { Dep } from 'src/dep'
import { Data, MVVM } from 'src/mvvm'

export function observe(
    value: Data | Data[keyof Data],
    vm?: MVVM
): Data | Data[keyof Data] {
    if (!value || typeof value !== 'object') return value
    return new Observer(value, vm).proxy
}

export class Observer {
    public dep: Dep
    public proxy: Record<string, any>

    constructor(data: Data, vm: MVVM) {
        Object.keys(data).forEach((key) => {
            data[key] = observe(data[key], vm)
        })
        this.dep = new Dep()
        this.proxy = new Proxy(data, {
            get: (target, key, receiver) => {
                if (Dep.target) this.dep.depend()
                return Reflect.get(target, key, receiver)
            },
            set: (target, key, newValue) => {
                const result = Reflect.set(target, key, observe(newValue))
                this.dep.notify()
                return result
            },
        })
    }
}
