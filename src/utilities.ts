export const extend = <T extends object, U extends object>(
    a: T,
    b: U
): T & U => {
    for (const key in b) {
        ;(a as any)[key] = b[key]
    }
    return a as any
}

export const isFunction = (val: unknown): val is Function =>
    typeof val === 'function'

export const NOOP = () => {}

export const objectToString = Object.prototype.toString
export const toTypeString = (value: unknown): string =>
    objectToString.call(value)

export const isPlainObject = (val: unknown): val is object =>
    toTypeString(val) === '[object Object]'

const hasOwnProperty = Object.prototype.hasOwnProperty
export const hasOwn = (
    val: object,
    key: string | symbol | number
): key is keyof typeof val => hasOwnProperty.call(val, key)

export type ArrayHash = {
    [index: number]: unknown
    length: number
}

export function toArray<T extends ArrayHash, R>(nodes: T): Array<R> {
    return [].slice.call(nodes)
}

export const unique = <T>(arr: T[]) => Array.from(new Set(arr))
