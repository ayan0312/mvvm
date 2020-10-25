import { Watcher } from 'src/watcher'
import { getVMVal, MVVM, setVMVal, triggerLifecycleHook } from 'src/mvvm'
import { isPlainObject, toArray } from 'src/utilities'
import { ElementUtility, HTMLModelElement } from 'src/document'

function isDirective(attr: string): boolean {
    return attr.indexOf('v-') == 0
}

const parseAnyDirectiveFunction = (parseString) => {
    return (dir: string) => dir.indexOf(parseString) === 0
}

const isEventDirective = parseAnyDirectiveFunction('on')
const isTextDirective = parseAnyDirectiveFunction('text')
const isHtmlDirective = parseAnyDirectiveFunction('html')
const isModelDirective = parseAnyDirectiveFunction('model')
const isClassDirective = parseAnyDirectiveFunction('class')
const isStyleDirective = parseAnyDirectiveFunction('style')
const isShowDirective = parseAnyDirectiveFunction('show')

function bindWatcher(node: Element | Text, vm: MVVM, exp: string, updater) {
    let val = getVMVal(vm, exp)
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

export class Compile {
    public $vm: MVVM
    public $el: Element
    public $fragment: DocumentFragment

    constructor(el: string | Element, vm: MVVM) {
        this.$vm = vm
        this.$el = ElementUtility.isElementNode(el)
            ? el
            : document.querySelector(el)

        if (!this.$el) throw ''

        triggerLifecycleHook(this.$vm, 'beforeMount')
        this.$fragment = ElementUtility.fragment(this.$el)
        this.compileElement(this.$fragment)
        this.$el.appendChild(this.$fragment)
        triggerLifecycleHook(this.$vm, 'mounted')
    }

    public compileElement(el: DocumentFragment | ChildNode) {
        let childNodes = el.childNodes

        childNodes.forEach((node) => {
            let reg = /\{\{(.*)\}\}/
            if (ElementUtility.isElementNode(node)) this.compile(node)
            else if (
                ElementUtility.isTextNode(node) &&
                reg.test(node.textContent)
            )
                bindWatcher(
                    node,
                    this.$vm,
                    RegExp.$1.trim(),
                    ElementUtility.text
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

            let exp = attr.value
            let dir = attrName.substring(2)

            if (isEventDirective(dir)) {
                let eventType = dir.split(':')[1]
                eventHandler(node, this.$vm, exp, eventType)
            } else if (isTextDirective(dir))
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

            node.removeAttribute(attrName)
        })
    }
}
