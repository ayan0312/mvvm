import { Watcher, WatcherCallback } from 'src/watcher'
import { Compile } from 'src/compile'
import { observe } from 'src/observer'
import { extend, isFunction, NOOP } from 'src/utilities'
import { Component } from 'src/component'

export type DataType = any
export interface Computed {
    [propName: string]: ComputedFunction | ComputedObject
}

export type ComputedFunction = () => DataType
export type ComputedObject = {
    get: ComputedFunction
    set: () => void
}

export type Methods = Record<string, Function>
export type DataKey = string
export type Data = Record<DataKey, DataType>

export type LifecycleHookName =
    | 'beforeCreate'
    | 'created'
    | 'beforeMount'
    | 'mounted'
    | 'beforeUpdate'
    | 'updated'
export type LifecycleHookFunction = () => void
export type MVVMLifecycleHooks = Record<
    LifecycleHookName,
    LifecycleHookFunction
>

export interface MVVMOptions extends Partial<MVVMLifecycleHooks> {
    element?: string
    computed?: Computed
    data?: Data
    methods?: Methods
    components?: Record<string, Component>
    watch?: Record<keyof Data, WatcherCallback>
}

export function triggerLifecycleHook(vm: MVVM, hookName: LifecycleHookName) {
    vm.$options[hookName] && vm.$options[hookName].call(vm)
}

export class MVVM {
    public $options: MVVMOptions
    public $compile: Compile
    public $data: Data

    constructor(options: MVVMOptions = {}) {
        this.$options = options || {}
        this.$options.components = extend(
            MVVM._components,
            this.$options.components || {}
        )
        this.$data = this.$options.data
        this._init()
        this.$compile = new Compile(
            'element' in options ? options.element : document.body,
            this
        )
    }

    public static component(name: string, component: Component): void {
        MVVM._components[name] = component
    }

    public static _components: Record<string, Component>

    public $watch(key: string, cb: WatcherCallback) {
        new Watcher(this, key, cb)
    }

    private _init() {
        this._initMethods()
        triggerLifecycleHook(this, 'beforeCreate')
        this._initData()
        this._initComputed()
        this._initWatch()
        triggerLifecycleHook(this, 'created')
    }

    private _initMethods(): void {
        let methods = this.$options.methods
        if (typeof methods !== 'object') return
        Object.keys(methods).forEach((key) => {
            let object = methods[key]
            if (!isFunction(object)) return
            if (this[key]) return
            this[key] = object
        })
    }

    private _initData(): void {
        Object.keys(this.$data).forEach((key) => this._proxyData(key))
        this.$data = observe(this.$data, this)
    }

    private _initComputed(): void {
        let computed = this.$options.computed
        if (typeof computed !== 'object') return
        Object.keys(computed).forEach((key) => {
            let object = computed[key]
            Object.defineProperty(this, key, {
                get: isFunction(object) ? object : object.get,
                set: NOOP,
            })
        })
    }

    private _initWatch(): void {
        let watch = this.$options.watch
        if (typeof watch !== 'object') return
        Object.keys(watch).forEach((key) => {
            let object = watch[key]
            if (!isFunction(object)) return
            this.$watch(key, object)
        })
    }

    private _proxyData(key: DataKey): void {
        Object.defineProperty(this, key, {
            configurable: false,
            enumerable: true,
            get: () => {
                return this.$data[key]
            },
            set: (newVal) => {
                this.$data[key] = newVal
            },
        })
    }
}

export function getVMVal(vm: MVVM, exp: string): DataType {
    let temp: DataType
    exp.split('.').forEach((k, i) => {
        if (i === 0) temp = vm[k]
        else temp = temp[k]
    })
    return temp
}

export function setVMVal(vm: MVVM, exp: string, value: DataType): void {
    let temp: DataType
    let exps = exp.split('.')
    if (exps.length === 1) vm[exps[0]] = value
    else
        exps.forEach((k, i, exps) => {
            if (i === 0) temp = vm[k]
            else if (i < exps.length - 1) temp = temp[k]
            else if (i === exps.length - 1) temp[k] = value
        })
}
