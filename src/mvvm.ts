import { Watcher, WatcherCallback } from './watcher'
import { Compile } from './compile'
import { observe } from './observer'
import { extend, isFunction, NOOP } from './utilities'
import { Component } from './component'
import { EventEmitter } from './events'

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

export function getApplyFunction<T extends Function, R>(fn: T, scope: R): T {
    const func: any = function () {
        fn.apply(scope, arguments)
    }
    return func
}

export class MVVM {
    public $options: MVVMOptions
    public $compile: Compile
    public $data: Data
    public $event: EventEmitter<MVVM> = new EventEmitter(this)
    public $el: Element

    public $on = getApplyFunction(this.$event.on, this.$event)
    public $emit = getApplyFunction(this.$event.emit, this.$event)
    public $off = getApplyFunction(this.$event.off, this.$event)
    public $once = getApplyFunction(this.$event.once, this.$event)
    public $watch(key: string, cb: WatcherCallback) {
        new Watcher(this, key, cb)
    }

    constructor(options: MVVMOptions = {}) {
        this.$options = options
        this.$options.components = extend(
            MVVM._components,
            this.$options.components || {}
        )
        this._init()
        this.$compile = new Compile(
            'element' in options ? options.element : document.body,
            this
        )
    }

    public emitLifecycle(hookName: string) {
        this.$options[hookName] && this.$options[hookName].call(this)
    }

    public static component(name: string, component: Component): void {
        MVVM._components[name] = component
    }

    public static _components: Record<string, Component>

    private _init() {
        this._initMethods()
        this._initLifecycle()
        this.$emit('beforeCreate')
        this._initData()
        this._initComputed()
        this._initWatch()
        this.$emit('created')
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

    private _initLifecycle() {
        this.$options.beforeCreate &&
            this.$on('beforeCreate', this.$options.beforeCreate)
        this.$options.created && this.$on('created', this.$options.created)
        this.$options.beforeMount &&
            this.$on('beforeMount', this.$options.beforeMount)
        this.$options.mounted && this.$on('mounted', this.$options.mounted)
        this.$options.beforeUpdate &&
            this.$on('beforeUpdate', this.$options.beforeUpdate)
        this.$options.updated && this.$on('updated', this.$options.updated)
    }

    private _initData(): void {
        this.$data = this.$options.data
        Object.keys(this.$data).forEach((key) =>
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
        )
        this.$data = observe(this.$data, this)
    }

    private _initComputed(): void {
        let computed = this.$options.computed
        if (typeof computed !== 'object') return
        Object.keys(computed).forEach((key) => {
            let object = computed[key]
            Object.defineProperty(this, key, {
                get: isFunction(object)
                    ? object
                    : 'get' in object
                    ? object.get
                    : NOOP,
                set: isFunction(object)
                    ? object
                    : 'set' in object
                    ? object.set
                    : NOOP,
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
