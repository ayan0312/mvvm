function* getSequence() {
    let i = 0;
    while (true) {
        yield (i = i + 1);
    }
}
let sequence = getSequence();
function getId(name) {
    return `${name ? name : 'none'}.${new Date().getTime()}.${Math.floor(Math.random() * 10000)}.${sequence.next().value}`;
}
class Dep {
    constructor(name) {
        this.id = getId(name);
        this.subs = [];
    }
    delete() {
        if (this.subs.length < 1)
            return;
        this.notify();
        this.subs.forEach((sub) => {
            sub.removeDep(this);
        });
        this.subs = [];
    }
    addSub(sub) {
        this.subs.push(sub);
    }
    depend() {
        Dep.target.addDep(this);
    }
    notify() {
        if (this.subs.length < 1)
            return;
        this.subs.forEach((sub) => {
            sub.update();
        });
    }
}
Dep.target = null;

const extend = (a, b) => {
    for (const key in b) {
        a[key] = b[key];
    }
    return a;
};
const isFunction = (val) => typeof val === 'function';
const NOOP = () => { };
const objectToString = Object.prototype.toString;
const toTypeString = (value) => objectToString.call(value);
const isPlainObject = (val) => toTypeString(val) === '[object Object]';
const hasOwnProperty = Object.prototype.hasOwnProperty;
const hasOwn = (val, key) => hasOwnProperty.call(val, key);
function toArray(nodes) {
    return [].slice.call(nodes);
}
const unique = (arr) => Array.from(new Set(arr));

function observe(value, vm) {
    if (!value || typeof value !== 'object')
        return value;
    return new Observer(value, vm).proxy;
}
class Observer {
    constructor(data, vm) {
        Object.keys(data).forEach((key) => {
            data[key] = observe(data[key], vm);
        });
        this.dep = new Dep('data');
        data['__ob__'] = this;
        this.proxy = new Proxy(data, {
            get: (target, key, receiver) => {
                if (Dep.target)
                    this.dep.depend();
                return Reflect.get(target, key, receiver);
            },
            set: (target, key, newValue, receiver) => {
                const result = Reflect.set(target, key, observe(newValue), receiver);
                this.dep.notify();
                return result;
            },
            deleteProperty: (target, key) => {
                const childObj = target[key];
                let result = false;
                if (isPlainObject(childObj) && hasOwn(childObj, '__ob__')) {
                    let ob = childObj['__ob__'];
                    ob.dep.delete();
                    ob = null;
                    result = Reflect.deleteProperty(target, key);
                }
                return result;
            },
        });
    }
}

class EventEmitter {
    constructor(scope) {
        this._events = new Map();
        if (scope)
            this._scope = scope;
    }
    on(eventName, callback) {
        if (!this._events.has(eventName))
            this._events.set(eventName, []);
        this._events.get(eventName).push(callback);
    }
    emit(eventName, value) {
        if (!this._events.has(eventName))
            return;
        this._events.get(eventName).forEach((callback) => {
            if (isFunction(callback)) {
                if (this._scope)
                    callback.call(this._scope, value);
                else
                    callback(value);
            }
        });
    }
    off(eventName, callback) {
        if (callback) {
            this._events.set(eventName, this._events.get(eventName).filter((cb) => {
                if (cb === callback || cb.originFunction === callback)
                    return false;
            }));
        }
        else {
            this._events.delete(eventName);
        }
    }
    once(eventName, callback) {
        const self = this;
        const onceCallback = function () {
            self.off(eventName, onceCallback);
            callback.apply(self, arguments);
        };
        onceCallback.originFunction = callback;
        this.on(eventName, onceCallback);
    }
}

function getApplyFunction(fn, scope) {
    return function () {
        fn.apply(scope, arguments);
    };
}
class MVVM {
    constructor(options = {}) {
        this.$event = new EventEmitter(this);
        this.$on = getApplyFunction(this.$event.on, this.$event);
        this.$emit = getApplyFunction(this.$event.emit, this.$event);
        this.$off = getApplyFunction(this.$event.off, this.$event);
        this.$once = getApplyFunction(this.$event.once, this.$event);
        this.$options = options;
        this.$options.components = extend(MVVM._components, this.$options.components || {});
        this.$data = this.$options.data;
        this._init();
        this.$compile = new Compile('element' in options ? options.element : document.body, this);
    }
    $watch(key, cb) {
        new Watcher(this, key, cb);
    }
    emitLifecycle(hookName) {
        this.$options[hookName] && this.$options[hookName].call(this);
    }
    static component(name, component) {
        MVVM._components[name] = component;
    }
    _init() {
        this._initMethods();
        this.emitLifecycle('beforeCreate');
        this._initData();
        this._initComputed();
        this._initWatch();
        this.emitLifecycle('created');
    }
    _initMethods() {
        let methods = this.$options.methods;
        if (typeof methods !== 'object')
            return;
        Object.keys(methods).forEach((key) => {
            let object = methods[key];
            if (!isFunction(object))
                return;
            if (this[key])
                return;
            this[key] = object;
        });
    }
    _initLifecycle() {
    }
    _initData() {
        Object.keys(this.$data).forEach((key) => Object.defineProperty(this, key, {
            configurable: false,
            enumerable: true,
            get: () => {
                return this.$data[key];
            },
            set: (newVal) => {
                this.$data[key] = newVal;
            },
        }));
        this.$data = observe(this.$data, this);
    }
    _initComputed() {
        let computed = this.$options.computed;
        if (typeof computed !== 'object')
            return;
        Object.keys(computed).forEach((key) => {
            let object = computed[key];
            Object.defineProperty(this, key, {
                get: isFunction(object) ? object : object.get,
                set: NOOP,
            });
        });
    }
    _initWatch() {
        let watch = this.$options.watch;
        if (typeof watch !== 'object')
            return;
        Object.keys(watch).forEach((key) => {
            let object = watch[key];
            if (!isFunction(object))
                return;
            this.$watch(key, object);
        });
    }
}
function getVMVal(vm, exp) {
    let temp;
    exp.split('.').forEach((k, i) => {
        if (i === 0)
            temp = vm[k];
        else
            temp = temp[k];
    });
    return temp;
}
function setVMVal(vm, exp, value) {
    let temp;
    let exps = exp.split('.');
    if (exps.length === 1)
        vm[exps[0]] = value;
    else
        exps.forEach((k, i, exps) => {
            if (i === 0)
                temp = vm[k];
            else if (i < exps.length - 1)
                temp = temp[k];
            else if (i === exps.length - 1)
                temp[k] = value;
        });
}

function parseGetter(exp) {
    return (vm) => getVMVal(vm, exp);
}
class Watcher {
    constructor(vm, expOrFn, cb) {
        this.cb = cb;
        this.vm = vm;
        this.expOrFn = expOrFn;
        this.depIds = {};
        if (isFunction(expOrFn))
            this.getter = expOrFn;
        else
            this.getter = parseGetter(expOrFn.trim());
        this.value = this.get();
    }
    update() {
        let newValue = this.get();
        let oldVal = this.value;
        if (newValue !== oldVal) {
            this.value = newValue;
            this.cb.call(this.vm, newValue, oldVal);
        }
    }
    removeDep(dep) {
        delete this.depIds[dep.id];
    }
    addDep(dep) {
        if (!hasOwn(this.depIds, dep.id)) {
            dep.addSub(this);
            this.depIds[dep.id] = dep;
        }
    }
    get() {
        Dep.target = this;
        let value = this.getter.call(this.vm, this.vm);
        Dep.target = null;
        return value;
    }
}

class ElementUtility {
    static fragment(el) {
        let fragment = document.createDocumentFragment(), child;
        while ((child = el.firstChild))
            fragment.appendChild(child);
        return fragment;
    }
    static parseHTML(html) {
        let temp = document.createElement('div');
        temp.innerHTML = html;
        return ElementUtility.fragment(temp);
    }
    static isElementNode(node) {
        if (node instanceof Element)
            return node.nodeType == 1;
        return false;
    }
    static isTextNode(node) {
        if (node instanceof Text)
            return node.nodeType == 3;
        return false;
    }
    static text(node, value) {
        if (typeof value === 'number')
            value = String(value);
        node.textContent = value ? value : '';
    }
    static html(node, value) {
        if (typeof value === 'number')
            value = String(value);
        node.innerHTML = value ? value : '';
    }
    static class(node, value, oldValue) {
        let className = node.className;
        className = className.replace(oldValue, '').replace(/\s$/, '');
        let space = className && String(value) ? ' ' : '';
        node.className = className + space + value;
    }
    static model(node, newValue) {
        if (typeof newValue === 'number')
            newValue = String(newValue);
        node.value = newValue ? newValue : '';
    }
    static style(node, newValue, oldValue) {
        if (!oldValue)
            oldValue = {};
        if (!newValue)
            newValue = {};
        const keys = Object.keys(oldValue).concat(Object.keys(newValue));
        unique(keys).forEach((key) => {
            if (hasOwn(oldValue, key) && hasOwn(newValue, key)) {
                if (oldValue[key] != newValue[key])
                    node.style.setProperty(key, newValue[key]);
            }
            else if (hasOwn(newValue, key))
                node.style.setProperty(key, newValue[key]);
            else
                node.style.removeProperty(key);
        });
    }
    static display(node, newValue, oldValue) {
        let func = (val) => {
            return {
                display: val ? 'block' : 'none',
            };
        };
        ElementUtility.style(node, func(newValue), func(oldValue));
    }
}

function isDirective(attr) {
    return attr.indexOf('v-') == 0;
}
const parseAnyDirectiveFunction = (parseString) => {
    return (dir) => dir.indexOf(parseString) === 0;
};
const isEventDirective = parseAnyDirectiveFunction('on');
const isTextDirective = parseAnyDirectiveFunction('text');
const isHtmlDirective = parseAnyDirectiveFunction('html');
const isModelDirective = parseAnyDirectiveFunction('model');
const isClassDirective = parseAnyDirectiveFunction('class');
const isStyleDirective = parseAnyDirectiveFunction('style');
const isShowDirective = parseAnyDirectiveFunction('show');
function bindWatcher(node, vm, exp, updater) {
    let val = getVMVal(vm, exp);
    updater && updater(node, val);
    new Watcher(vm, exp, (newValue, oldValue) => {
        if (newValue === oldValue)
            return;
        updater && updater(node, newValue, oldValue);
    });
}
function eventHandler(node, vm, exp, eventType) {
    let fn = vm.$options.methods && vm.$options.methods[exp];
    if (eventType && fn) {
        node.addEventListener(eventType, fn.bind(vm), false);
    }
}
class Compile {
    constructor(el, vm) {
        this.$vm = vm;
        this.$el = ElementUtility.isElementNode(el)
            ? el
            : document.querySelector(el);
        if (!this.$el)
            throw '';
        this.$vm.emitLifecycle('beforeMount');
        this.$fragment = ElementUtility.fragment(this.$el);
        this.compileElement(this.$fragment);
        this.$el.appendChild(this.$fragment);
        this.$vm.emitLifecycle('mounted');
    }
    compileElement(el) {
        let childNodes = el.childNodes;
        childNodes.forEach((node) => {
            let reg = /\{\{(.*)\}\}/;
            if (ElementUtility.isElementNode(node))
                this.compile(node);
            else if (ElementUtility.isTextNode(node) &&
                reg.test(node.textContent))
                bindWatcher(node, this.$vm, RegExp.$1.trim(), ElementUtility.text);
            if (node.childNodes && node.childNodes.length)
                this.compileElement(node);
        });
    }
    compile(node) {
        let nodeAttrs = node.attributes;
        toArray(nodeAttrs).forEach((attr) => {
            let attrName = attr.name;
            if (!isDirective(attrName))
                return;
            let exp = attr.value;
            let dir = attrName.substring(2);
            if (isEventDirective(dir)) {
                let eventType = dir.split(':')[1];
                eventHandler(node, this.$vm, exp, eventType);
            }
            else if (isTextDirective(dir))
                bindWatcher(node, this.$vm, exp, ElementUtility.text);
            else if (isHtmlDirective(dir))
                bindWatcher(node, this.$vm, exp, ElementUtility.html);
            else if (isClassDirective(dir))
                bindWatcher(node, this.$vm, exp, ElementUtility.class);
            else if (isModelDirective(dir)) {
                bindWatcher(node, this.$vm, exp, ElementUtility.model);
                let val = getVMVal(this.$vm, exp);
                node.addEventListener('input', (e) => {
                    let target = e.target;
                    let newValue = target.value;
                    if (val === newValue)
                        return;
                    setVMVal(this.$vm, exp, newValue);
                    val = newValue;
                });
            }
            else if (isStyleDirective(dir))
                bindWatcher(node, this.$vm, exp, ElementUtility.style);
            else if (isShowDirective(dir))
                bindWatcher(node, this.$vm, exp, ElementUtility.display);
            node.removeAttribute(attrName);
        });
    }
}

export { Compile, Dep, ElementUtility, MVVM, NOOP, Observer, Watcher, extend, getApplyFunction, getId, getSequence, getVMVal, hasOwn, isFunction, isPlainObject, objectToString, observe, parseGetter, setVMVal, toArray, toTypeString, unique };
//# sourceMappingURL=mvvm.esm.js.map
