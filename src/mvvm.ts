import { Watcher, WatcherCallback } from './watcher'
import { Compile } from './compile'
import { observe } from './observer'
import { extend, isFunction, isPlainObject, NOOP } from './utilities'
import { MVVMComponent, MVVMComponentOptions } from './component'
import { EventEmitter } from './events'
import { EventLoop } from './nextTick'

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
    element?: string | HTMLElement
    computed?: Computed
    data?: Data | (() => Data)
    methods?: Methods
    components?: Record<string, MVVMComponentOptions>
    watch?: Record<keyof Data, WatcherCallback>
}

export function getApplyFunction<T extends Function, R>(fn: T, scope: R): T {
    const func: any = function () {
        fn.apply(scope, arguments)
    }
    return func
}

export const createVM = (options: MVVMOptions = {}) =>
    new MVVM(
        extend(options, {
            element: options.element ? options.element : document.body,
        })
    )

export class MVVM {
    public static cid = 0

    public readonly $event = new EventEmitter<MVVM>(this)

    public components: Record<string, Omit<MVVMComponentOptions, 'parent'>>
    public cid: number

    public $children: Record<string, MVVMComponent> = {}
    public $refs: Record<string, Element> = {}

    public $options: MVVMOptions
    public $compile: Compile
    public $data: Data
    public $el: Element

    public $on = getApplyFunction(this.$event.on, this.$event)
    public $emit = getApplyFunction(this.$event.emit, this.$event)
    public $off = getApplyFunction(this.$event.off, this.$event)
    public $once = getApplyFunction(this.$event.once, this.$event)

    public $watch(key: string, cb: WatcherCallback) {
        new Watcher(this, key, cb)
    }

    public $nextTick(callback?: () => void) {
        if (callback) return EventLoop.nextTick<MVVM>(this, callback)
        return EventLoop.nextTick<MVVM>(this)
    }

    constructor(options: MVVMOptions = {}) {
        this.$options = options
        this.components = options.components
        MVVM.cid += 1
        this.cid = MVVM.cid
        this._init()
        if (this.$options.element) this.compile(this.$options.element)
    }

    public use(fn: Function): MVVM {
        fn.call(this, this)
        return this
    }

    protected compile(element: string | Element) {
        this.$compile = new Compile(element, this)
        this.$emit('mounted')
    }

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
        const data = this.$options.data
        this.$data = isFunction(data) ? data() : data
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
        if (!isPlainObject(computed)) return
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
