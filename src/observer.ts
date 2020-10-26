import { Dep } from './dep'
import { Data, MVVM } from './mvvm'
import { hasOwn, isPlainObject } from './utilities'

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
        this.dep = new Dep('data')
        data['__ob__'] = this
        this.proxy = new Proxy(data, {
            get: (target, key, receiver) => {
                if (Dep.target) this.dep.depend()
                return Reflect.get(target, key, receiver)
            },
            set: (target, key, newValue, receiver) => {
                const result = Reflect.set(
                    target,
                    key,
                    observe(newValue),
                    receiver
                )
                this.dep.notify()
                return result
            },
            deleteProperty: (target, key: string) => {
                const childObj = target[key]
                let result: boolean = false
                if (isPlainObject(childObj) && hasOwn(childObj, '__ob__')) {
                    let ob = childObj['__ob__']
                    ob.dep.delete()
                    ob = null
                    result = Reflect.deleteProperty(target, key)
                }
                return result
            },
        })
    }
}
