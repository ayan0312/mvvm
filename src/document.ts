import { hasOwn, unique } from './utilities'

export type HTMLModelElement = HTMLInputElement
export type HTMLStyle = Record<string, string>

export class ElementUtility {
    public static fragment(el: Element): DocumentFragment {
        let fragment = document.createDocumentFragment(),
            child: ChildNode
        while ((child = el.firstChild)) fragment.appendChild(child)
        return fragment
    }

    public static parseHTML(html: string): DocumentFragment {
        let temp = document.createElement('div')
        temp.innerHTML = html
        return ElementUtility.fragment(temp)
    }

    public static isElementNode(node: unknown): node is Element {
        if (node instanceof Element) return node.nodeType == 1
        return false
    }

    public static isTextNode(node: unknown): node is Text {
        if (node instanceof Text) return node.nodeType == 3
        return false
    }

    public static text(node: Element, value: string): void {
        if (typeof value === 'number') value = String(value)
        node.textContent = value ? value : ''
    }

    public static html(node: Element, value: string): void {
        if (typeof value === 'number') value = String(value)
        node.innerHTML = value ? value : ''
    }

    public static class(node: Element, value: string, oldValue: string): void {
        let className = node.className
        className = className.replace(oldValue, '').replace(/\s$/, '')
        let space = className && String(value) ? ' ' : ''
        node.className = className + space + value
    }

    public static model(node: HTMLModelElement, newValue: string): void {
        if (typeof newValue === 'number') newValue = String(newValue)
        node.value = newValue ? newValue : ''
    }

    public static style(
        node: HTMLElement,
        newValue: HTMLStyle,
        oldValue: HTMLStyle
    ) {
        if (!oldValue) oldValue = {}
        if (!newValue) newValue = {}
        const keys = Object.keys(oldValue).concat(Object.keys(newValue))
        unique(keys).forEach((key) => {
            if (hasOwn(oldValue, key) && hasOwn(newValue, key)) {
                if (oldValue[key] != newValue[key])
                    node.style.setProperty(key, newValue[key])
            } else if (hasOwn(newValue, key))
                node.style.setProperty(key, newValue[key])
            else node.style.removeProperty(key)
        })
    }

    public static display(
        node: HTMLElement,
        newValue: boolean,
        oldValue: boolean
    ) {
        let func = (val) => {
            return {
                display: val ? 'block' : 'none',
            }
        }
        ElementUtility.style(node, func(newValue), func(oldValue))
    }
}
