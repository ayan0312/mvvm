import { Watcher } from 'src/watcher'
import { getVMVal, MVVM, setVMVal, triggerLifecycleHook } from 'src/mvvm'
import { toArray } from 'src/utilities'
import {
    elementClass,
    html,
    HTMLModelElement,
    isElementNode,
    isTextNode,
    model,
    node2Fragment,
    text,
} from 'src/document'

function isDirective(attr: string): boolean {
    return attr.indexOf('v-') == 0
}

function isEventDirective(dir: string): boolean {
    return dir.indexOf('on') === 0
}

function isTextDirective(dir: string): boolean {
    return dir.indexOf('text') === 0
}

function isHtmlDirective(dir: string): boolean {
    return dir.indexOf('html') === 0
}

function isModelDirective(dir: string): boolean {
    return dir.indexOf('model') === 0
}

function isClassDirective(dir: string): boolean {
    return dir.indexOf('class') === 0
}

function bindWatcher(node: Element | Text, vm: MVVM, exp: string, updater) {
    let val = getVMVal(vm, exp)
    if (typeof val === 'number') val = String(val)
    updater && updater(node, val)

    new Watcher(vm, exp, (value, oldValue) => {
        if (typeof value === 'number') value = String(value)
        updater && updater(node, value, oldValue)
    })
}

function eventHandler(node: Element, vm: MVVM, exp: string, eventType: string) {
    let fn = vm.$options.methods && vm.$options.methods[exp]

    if (eventType && fn) {
        node.addEventListener(eventType, fn.bind(vm), false)
    }
}

export class Compile {
    public $vm: MVVM
    public $el: Element
    public $fragment: DocumentFragment

    constructor(el: string | Element, vm: MVVM) {
        this.$vm = vm
        this.$el = isElementNode(el) ? el : document.querySelector(el)

        if (!this.$el) throw ''

        triggerLifecycleHook(this.$vm, 'beforeMount')
        this.$fragment = node2Fragment(this.$el)
        this.compileElement(this.$fragment)
        this.$el.appendChild(this.$fragment)
        triggerLifecycleHook(this.$vm, 'mounted')
    }

    public compileElement(el: DocumentFragment | ChildNode) {
        let childNodes = el.childNodes

        childNodes.forEach((node) => {
            let reg = /\{\{(.*)\}\}/
            if (isElementNode(node)) this.compile(node)
            else if (isTextNode(node) && reg.test(node.textContent))
                bindWatcher(node, this.$vm, RegExp.$1.trim(), text)
            if (node.childNodes && node.childNodes.length)
                this.compileElement(node)
        })
    }

    public compile(node: Element): void {
        let nodeAttrs = node.attributes
        toArray<NamedNodeMap, Attr>(nodeAttrs).forEach((attr) => {
            let attrName = attr.name
            if (!isDirective(attrName)) return

            let exp = attr.value
            let dir = attrName.substring(2)

            if (isEventDirective(dir)) {
                let eventType = dir.split(':')[1]
                eventHandler(node, this.$vm, exp, eventType)
            } else if (isTextDirective(dir))
                bindWatcher(node, this.$vm, exp, text)
            else if (isHtmlDirective(dir))
                bindWatcher(node, this.$vm, exp, html)
            else if (isClassDirective(dir))
                bindWatcher(node, this.$vm, exp, elementClass)
            else if (isModelDirective(dir)) {
                bindWatcher(node, this.$vm, exp, model)
                let val = getVMVal(this.$vm, exp)
                node.addEventListener('input', (e: any) => {
                    let target: HTMLModelElement = e.target
                    let newValue = target.value
                    if (val === newValue) return
                    setVMVal(this.$vm, exp, newValue)
                    val = newValue
                })
            }

            node.removeAttribute(attrName)
        })
    }
}
