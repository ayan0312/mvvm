import { Dep } from 'src/dep'
import { Data, MVVM } from 'src/mvvm'

export function observe(value: Data, vm?: MVVM): Observer {
    if (!value || typeof value !== 'object') return
    return new Observer(value, vm)
}

export class Observer {
    constructor(data: Data, vm: MVVM) {
        Object.keys(data).forEach((key) => {
            let dep = new Dep(key)
            let val = data[key]
            let childObj = observe(val)

            Object.defineProperty(data, key, {
                configurable: false,
                enumerable: true,
                get: () => {
                    if (Dep.target) dep.depend()
                    return val
                },
                set: (newVal) => {
                    if (newVal === val) return
                    val = newVal
                    childObj = observe(newVal)
                    dep.notify()
                },
            })
        })
    }
}
