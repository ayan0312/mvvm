import { Watcher } from './watcher'
import { getVMVal, MVVM, setVMVal } from './mvvm'
import { extend, hasOwn, toArray } from './utilities'
import { ElementUtility, HTMLModelElement } from './document'
import { MVVMComponent } from './component'

const parseAnyDirectiveFunction = (parseString) => {
    return (dir: string) => dir.indexOf(parseString) == 0
}

const isDirective = parseAnyDirectiveFunction('v-')
const isEventDirective = parseAnyDirectiveFunction('on')
const isTextDirective = parseAnyDirectiveFunction('text')
const isHtmlDirective = parseAnyDirectiveFunction('html')
const isModelDirective = parseAnyDirectiveFunction('model')
const isClassDirective = parseAnyDirectiveFunction('class')
const isStyleDirective = parseAnyDirectiveFunction('style')
const isShowDirective = parseAnyDirectiveFunction('show')
const isRefDirective = parseAnyDirectiveFunction('ref')
const isForDirective = parseAnyDirectiveFunction('for')

function bindWatcher(node: Element | Text, vm: MVVM, exp: string, updater) {
    let __for__ = (node as any)['__for__']
    let val: any
    if (__for__) {
        val = __for__ ? __for__[exp] : ''
    } else val = getVMVal(vm, exp)
    updater && updater(node, val)
    new Watcher(vm, exp, (newValue, oldValue) => {
        if (newValue === oldValue) return
        updater && updater(node, newValue, oldValue)
    })
}

function eventHandler(node: Element, vm: MVVM, exp: string, eventType: string) {
    let fn = vm.$options.methods && vm.$options.methods[exp]

    if (eventType && fn) {
        node.addEventListener(eventType, fn.bind(vm), false)
    }
}

// ... v-for="(item,index) in list"> {{index}}<...
function vFor(node: Element, vm: MVVM, exp: string, c: Compile): void {
    let reg = /\((.*)\)/
    let item: string, index: string, list: string
    if (reg.test(exp)) {
        const arr = RegExp.$1.trim().split(',')
        item = arr[0]
        index = arr[1]
        let rightString: string = (RegExp as any).rightContext.trim()
        let rarr = rightString.split(' ')
        list = rarr[1]
        if (rarr[0] !== 'in') return
        let val = getVMVal(vm, list)
        let children: Element[] = []
        toArray<HTMLCollection, Element>(node.children).forEach(
            (element: any) => {
                children.push(element.cloneNode(true))
                node.removeChild(element)
            }
        )
        for (let i = 0; i < val.length; i++) {
            children.forEach((element: any) => {
                let newNode = element.cloneNode(true)
                newNode.__for__ = {
                    [item]: val[i],
                    [index]: i,
                }
                node.appendChild(newNode)
                c.compileElement(node)
            })
        }
    }
}

function forHandler(node: Element, vm: MVVM, exp: string, c: Compile) {
    vFor(node, vm, exp, c)
    new Watcher(vm, exp, (newValue, oldValue) => {
        if (newValue === oldValue) return
        vFor(node, vm, exp, c)
    })
}

export class Compile {
    public readonly $vm: MVVM | MVVMComponent
    public readonly $el: Element

    public slotCallback: ((c: Compile) => void)[] = []

    public $slot?: DocumentFragment
    public $fragment?: DocumentFragment

    constructor(el: string, vm: MVVM)
    constructor(el: Element, vm: MVVM)
    constructor(el: Element, vm: MVVMComponent)
    constructor(el: string | Element, vm: MVVM | MVVMComponent)
    constructor(el: string | Element, vm: MVVM | MVVMComponent) {
        this.$vm = vm
        this.$el = ElementUtility.isElementNode(el)
            ? el
            : document.querySelector(el)
        this._init()
    }

    private _init() {
        if (this.$vm instanceof MVVMComponent) {
            this.$slot = ElementUtility.fragment(this.$el)
            this.$fragment = this.parseComponentTemplate(this.$vm.$template)
            this.$vm.$el = this.$el
            this.$vm.$emit('beforeMount')
            this.compileElement(this.$fragment)
            this.$el.parentNode.replaceChild(this.$fragment, this.$el)
        } else {
            this.$fragment = ElementUtility.fragment(this.$el)
            this.$vm.$el = this.$el
            this.$vm.$emit('beforeMount')
            this.compileElement(this.$fragment)
            this.$el.appendChild(this.$fragment)
        }
        Object.entries(this.$vm.$children).forEach(([key, child]) => {
            const slotCallback = child.$compile.slotCallback
            if (slotCallback.length < 1) return
            slotCallback.forEach((fn) => {
                fn(this)
            })
        })
    }

    public isSlot(node: Element) {
        if (node.tagName === 'SLOT') return true
        return false
    }

    public compileSlotElement(slot: Element) {
        if (!(this.$vm instanceof MVVMComponent)) return
        if (this.$slot.children.length === 0) {
            slot.parentNode.removeChild(slot)
            return
        }
        this.slotCallback.push((c) => {
            c.compileElement(this.$slot)
            slot.parentNode.replaceChild(this.$slot, slot)
        })
    }

    public parseComponentTemplate(templateHTML: string): DocumentFragment {
        let element = ElementUtility.parseHTML(templateHTML)
        const template = document.createElement('template')
        if (element.length) {
            if (element.length === 1) {
                if (element[0].tagName.toLowerCase() !== 'template')
                    template.appendChild(element[0])
            } else
                toArray<HTMLCollection, Element>(element).forEach((child) => {
                    template.appendChild(child)
                })
        }
        return ElementUtility.fragment(template)
    }

    public parseTemplate(leftString, rightString) {
        return (node: Element, newValue: string, oldValue: string) => {
            const str = leftString + newValue + rightString
            ElementUtility.text(node, str)
        }
    }

    public compileElement(el: DocumentFragment | ChildNode) {
        let childNodes = el.childNodes

        childNodes.forEach((node) => {
            if (el['__for__']) node['__for__'] = el['__for__']

            let reg = /\{\{(.*)\}\}/

            if (ElementUtility.isElementNode(node)) {
                if (this.isComponent(node)) {
                    this.compileComponent(node.tagName.toLowerCase(), node)
                    return
                } else if (this.isSlot(node)) {
                    this.compileSlotElement(node)
                    return
                } else this.compile(node)
            } else if (
                ElementUtility.isTextNode(node) &&
                reg.test(node.textContent)
            )
                bindWatcher(
                    node,
                    this.$vm,
                    RegExp.$1.trim(),
                    this.parseTemplate(
                        (RegExp as any).leftContext,
                        (RegExp as any).rightContext
                    )
                )

            if (node.childNodes && node.childNodes.length)
                this.compileElement(node)
        })
    }

    public compile(node: Element): void {
        let nodeAttrs = node.attributes
        toArray<NamedNodeMap, Attr>(nodeAttrs).forEach((attr) => {
            let attrName = attr.name
            if (!isDirective(attrName)) return

            let dir = attrName.substring(2)
            let suffix = dir.split(':')[1]
            let exp = attr.value || suffix

            if (isEventDirective(dir)) eventHandler(node, this.$vm, exp, suffix)
            else if (isTextDirective(dir))
                bindWatcher(node, this.$vm, exp, ElementUtility.text)
            else if (isHtmlDirective(dir))
                bindWatcher(node, this.$vm, exp, ElementUtility.html)
            else if (isClassDirective(dir))
                bindWatcher(node, this.$vm, exp, ElementUtility.class)
            else if (isModelDirective(dir)) {
                bindWatcher(node, this.$vm, exp, ElementUtility.model)
                let val = getVMVal(this.$vm, exp)
                node.addEventListener('input', (e: any) => {
                    let target: HTMLModelElement = e.target
                    let newValue = target.value
                    if (val === newValue) return
                    setVMVal(this.$vm, exp, newValue)
                    val = newValue
                })
            } else if (isStyleDirective(dir))
                bindWatcher(node, this.$vm, exp, ElementUtility.style)
            else if (isShowDirective(dir))
                bindWatcher(node, this.$vm, exp, ElementUtility.display)
            else if (isRefDirective(dir)) this.$vm.$refs[exp] = node
            else if (isForDirective(dir)) forHandler(node, this.$vm, exp, this)

            node.removeAttribute(attrName)
        })
    }

    public isComponent(node: Element) {
        const tagName = node.tagName.toLowerCase()
        if (!/^[(a-zA-Z)-]*$/.test(tagName)) return false
        if (this.$vm.components && hasOwn(this.$vm.components, tagName))
            return true
        return false
    }

    public compileComponent(componentName: string, node: Element) {
        const componentOptions = this.$vm.components[componentName]
        const component = new MVVMComponent(
            extend(componentOptions, {
                parent: this.$vm,
            })
        )
        component.$mount(node)
        this.$vm.$children[componentName] = component
    }
}
