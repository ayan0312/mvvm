export function node2Fragment(el: Element): DocumentFragment {
    let fragment = document.createDocumentFragment(),
        child: ChildNode
    while ((child = el.firstChild)) fragment.appendChild(child)
    return fragment
}

export function isElementNode(node: unknown): node is Element {
    if (node instanceof Element) return node.nodeType == 1
    return false
}

export function isTextNode(node: unknown): node is Text {
    if (node instanceof Text) return node.nodeType == 3
    return false
}

export function text(node: Element, value: string): void {
    node.textContent = value ? value : ''
}

export function html(node: Element, value: string): void {
    node.innerHTML = value ? value : ''
}

export function elementClass(
    node: Element,
    value: string,
    oldValue: string
): void {
    let className = node.className
    className = className.replace(oldValue, '').replace(/\s$/, '')
    let space = className && String(value) ? ' ' : ''
    node.className = className + space + value
}

export type HTMLModelElement = HTMLInputElement

export function model(
    node: HTMLModelElement,
    value: string,
    oldValue: string
): void {
    node.value = value ? value : ''
}
