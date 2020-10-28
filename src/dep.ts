import { Watcher } from './watcher'

export type ID = string

export function* getSequence() {
    let i = 0
    while (true) {
        yield (i = i + 1)
    }
}

let sequence = getSequence()

export function getId(name?: string): ID {
    return `${name ? name : 'none'}.${new Date().getTime()}.${Math.floor(
        Math.random() * 10000
    )}.${sequence.next().value}`
}

export class Dep {
    public readonly id: ID

    public subs: Watcher[] = []

    public static target: Watcher | null = null

    constructor(name?: string) {
        this.id = getId(name)
    }

    public delete(): void {
        if (this.subs.length < 1) return
        this.notify()
        this.subs.forEach((sub) => {
            sub.removeDep(this)
        })
        this.subs.length = 0
    }

    public addSub(sub: Watcher): void {
        this.subs.push(sub)
    }

    public depend(): void {
        Dep.target.addDep(this)
    }

    public notify(): void {
        if (this.subs.length < 1) return
        this.subs.forEach((sub) => {
            sub.update()
        })
    }
}
