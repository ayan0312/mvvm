import { MVVM, MVVMOptions } from './mvvm'

export interface MVVMComponentOptions extends Omit<MVVMOptions, 'element'> {
    template: string
    parent: MVVM | MVVMComponent
}

export class MVVMComponent extends MVVM {
    public $parent?: MVVM | MVVMComponent
    public $options: MVVMComponentOptions
    public $template: string

    constructor(options) {
        super(options)
        this.$template = options.template || ''
        if (options.parent) this.$parent = options.parent
    }

    public $mount(element: string | Element) {
        this.compile(element)
    }
}
