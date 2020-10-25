var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
define("dep", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Dep = exports.getId = exports.getSequence = void 0;
    function getSequence() {
        var i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!true) return [3 /*break*/, 3];
                    return [4 /*yield*/, (i = i + 1)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 1];
                case 3: return [2 /*return*/];
            }
        });
    }
    exports.getSequence = getSequence;
    var sequence = getSequence();
    function getId(name) {
        return (name ? name : 'none') + "." + new Date().getTime() + "." + Math.floor(Math.random() * 10000) + "." + sequence.next().value;
    }
    exports.getId = getId;
    var Dep = /** @class */ (function () {
        function Dep(name) {
            this.id = getId(name);
            this.subs = [];
        }
        Dep.prototype.delete = function () {
            var _this = this;
            if (this.subs.length < 1)
                return;
            this.notify();
            this.subs.forEach(function (sub) {
                sub.removeDep(_this);
            });
            this.subs = [];
        };
        Dep.prototype.addSub = function (sub) {
            this.subs.push(sub);
        };
        Dep.prototype.depend = function () {
            Dep.target.addDep(this);
        };
        Dep.prototype.notify = function () {
            if (this.subs.length < 1)
                return;
            this.subs.forEach(function (sub) {
                sub.update();
            });
        };
        Dep.target = null;
        return Dep;
    }());
    exports.Dep = Dep;
});
define("utilities", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.unique = exports.toArray = exports.hasOwn = exports.isPlainObject = exports.toTypeString = exports.objectToString = exports.NOOP = exports.isFunction = exports.extend = void 0;
    exports.extend = function (a, b) {
        for (var key in b) {
            ;
            a[key] = b[key];
        }
        return a;
    };
    exports.isFunction = function (val) {
        return typeof val === 'function';
    };
    exports.NOOP = function () { };
    exports.objectToString = Object.prototype.toString;
    exports.toTypeString = function (value) {
        return exports.objectToString.call(value);
    };
    exports.isPlainObject = function (val) {
        return exports.toTypeString(val) === '[object Object]';
    };
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    exports.hasOwn = function (val, key) { return hasOwnProperty.call(val, key); };
    function toArray(nodes) {
        return [].slice.call(nodes);
    }
    exports.toArray = toArray;
    exports.unique = function (arr) { return Array.from(new Set(arr)); };
});
define("observer", ["require", "exports", "dep", "utilities"], function (require, exports, dep_1, utilities_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Observer = exports.observe = void 0;
    function observe(value, vm) {
        if (!value || typeof value !== 'object')
            return value;
        return new Observer(value, vm).proxy;
    }
    exports.observe = observe;
    var Observer = /** @class */ (function () {
        function Observer(data, vm) {
            var _this = this;
            Object.keys(data).forEach(function (key) {
                data[key] = observe(data[key], vm);
            });
            this.dep = new dep_1.Dep('data');
            data['__ob__'] = this;
            this.proxy = new Proxy(data, {
                get: function (target, key, receiver) {
                    if (dep_1.Dep.target)
                        _this.dep.depend();
                    return Reflect.get(target, key, receiver);
                },
                set: function (target, key, newValue, receiver) {
                    var result = Reflect.set(target, key, observe(newValue), receiver);
                    _this.dep.notify();
                    return result;
                },
                deleteProperty: function (target, key) {
                    var childObj = target[key];
                    var result = false;
                    if (utilities_1.isPlainObject(childObj) && utilities_1.hasOwn(childObj, '__ob__')) {
                        var ob = childObj['__ob__'];
                        ob.dep.delete();
                        ob = null;
                        result = Reflect.deleteProperty(target, key);
                    }
                    return result;
                }
            });
        }
        return Observer;
    }());
    exports.Observer = Observer;
});
define("component", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("mvvm", ["require", "exports", "watcher", "compile", "observer", "utilities"], function (require, exports, watcher_1, compile_1, observer_1, utilities_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.setVMVal = exports.getVMVal = exports.MVVM = exports.triggerLifecycleHook = void 0;
    function triggerLifecycleHook(vm, hookName) {
        vm.$options[hookName] && vm.$options[hookName].call(vm);
    }
    exports.triggerLifecycleHook = triggerLifecycleHook;
    var MVVM = /** @class */ (function () {
        function MVVM(options) {
            if (options === void 0) { options = {}; }
            this.$options = options || {};
            this.$options.components = utilities_2.extend(MVVM._components, this.$options.components || {});
            this.$data = this.$options.data;
            this._init();
            this.$compile = new compile_1.Compile('element' in options ? options.element : document.body, this);
        }
        MVVM.component = function (name, component) {
            MVVM._components[name] = component;
        };
        MVVM.prototype.$watch = function (key, cb) {
            new watcher_1.Watcher(this, key, cb);
        };
        MVVM.prototype._init = function () {
            this._initMethods();
            triggerLifecycleHook(this, 'beforeCreate');
            this._initData();
            this._initComputed();
            this._initWatch();
            triggerLifecycleHook(this, 'created');
        };
        MVVM.prototype._initMethods = function () {
            var _this = this;
            var methods = this.$options.methods;
            if (typeof methods !== 'object')
                return;
            Object.keys(methods).forEach(function (key) {
                var object = methods[key];
                if (!utilities_2.isFunction(object))
                    return;
                if (_this[key])
                    return;
                _this[key] = object;
            });
        };
        MVVM.prototype._initData = function () {
            var _this = this;
            Object.keys(this.$data).forEach(function (key) { return _this._proxyData(key); });
            this.$data = observer_1.observe(this.$data, this);
        };
        MVVM.prototype._initComputed = function () {
            var _this = this;
            var computed = this.$options.computed;
            if (typeof computed !== 'object')
                return;
            Object.keys(computed).forEach(function (key) {
                var object = computed[key];
                Object.defineProperty(_this, key, {
                    get: utilities_2.isFunction(object) ? object : object.get,
                    set: utilities_2.NOOP,
                });
            });
        };
        MVVM.prototype._initWatch = function () {
            var _this = this;
            var watch = this.$options.watch;
            if (typeof watch !== 'object')
                return;
            Object.keys(watch).forEach(function (key) {
                var object = watch[key];
                if (!utilities_2.isFunction(object))
                    return;
                _this.$watch(key, object);
            });
        };
        MVVM.prototype._proxyData = function (key) {
            var _this = this;
            Object.defineProperty(this, key, {
                configurable: false,
                enumerable: true,
                get: function () {
                    return _this.$data[key];
                },
                set: function (newVal) {
                    _this.$data[key] = newVal;
                },
            });
        };
        return MVVM;
    }());
    exports.MVVM = MVVM;
    function getVMVal(vm, exp) {
        var temp;
        exp.split('.').forEach(function (k, i) {
            if (i === 0)
                temp = vm[k];
            else
                temp = temp[k];
        });
        return temp;
    }
    exports.getVMVal = getVMVal;
    function setVMVal(vm, exp, value) {
        var temp;
        var exps = exp.split('.');
        if (exps.length === 1)
            vm[exps[0]] = value;
        else
            exps.forEach(function (k, i, exps) {
                if (i === 0)
                    temp = vm[k];
                else if (i < exps.length - 1)
                    temp = temp[k];
                else if (i === exps.length - 1)
                    temp[k] = value;
            });
    }
    exports.setVMVal = setVMVal;
});
define("watcher", ["require", "exports", "dep", "mvvm", "utilities"], function (require, exports, dep_2, mvvm_1, utilities_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Watcher = exports.parseGetter = void 0;
    function parseGetter(exp) {
        return function (vm) { return mvvm_1.getVMVal(vm, exp); };
    }
    exports.parseGetter = parseGetter;
    /**
     *
     */
    var Watcher = /** @class */ (function () {
        function Watcher(vm, expOrFn, cb) {
            this.cb = cb;
            this.vm = vm;
            this.expOrFn = expOrFn;
            this.depIds = {};
            if (utilities_3.isFunction(expOrFn))
                this.getter = expOrFn;
            else
                this.getter = parseGetter(expOrFn.trim());
            this.value = this.get();
        }
        Watcher.prototype.update = function () {
            var newValue = this.get();
            var oldVal = this.value;
            if (newValue !== oldVal) {
                this.value = newValue;
                this.cb.call(this.vm, newValue, oldVal);
            }
        };
        Watcher.prototype.removeDep = function (dep) {
            delete this.depIds[dep.id];
        };
        Watcher.prototype.addDep = function (dep) {
            if (!utilities_3.hasOwn(this.depIds, dep.id)) {
                dep.addSub(this);
                this.depIds[dep.id] = dep;
            }
        };
        Watcher.prototype.get = function () {
            dep_2.Dep.target = this;
            var value = this.getter.call(this.vm, this.vm);
            dep_2.Dep.target = null;
            return value;
        };
        return Watcher;
    }());
    exports.Watcher = Watcher;
});
define("document", ["require", "exports", "utilities"], function (require, exports, utilities_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ElementUtility = void 0;
    var ElementUtility = /** @class */ (function () {
        function ElementUtility() {
        }
        ElementUtility.fragment = function (el) {
            var fragment = document.createDocumentFragment(), child;
            while ((child = el.firstChild))
                fragment.appendChild(child);
            return fragment;
        };
        ElementUtility.isElementNode = function (node) {
            if (node instanceof Element)
                return node.nodeType == 1;
            return false;
        };
        ElementUtility.isTextNode = function (node) {
            if (node instanceof Text)
                return node.nodeType == 3;
            return false;
        };
        ElementUtility.text = function (node, value) {
            if (typeof value === 'number')
                value = String(value);
            node.textContent = value ? value : '';
        };
        ElementUtility.html = function (node, value) {
            if (typeof value === 'number')
                value = String(value);
            node.innerHTML = value ? value : '';
        };
        ElementUtility.class = function (node, value, oldValue) {
            var className = node.className;
            className = className.replace(oldValue, '').replace(/\s$/, '');
            var space = className && String(value) ? ' ' : '';
            node.className = className + space + value;
        };
        ElementUtility.model = function (node, newValue) {
            if (typeof newValue === 'number')
                newValue = String(newValue);
            node.value = newValue ? newValue : '';
        };
        ElementUtility.style = function (node, newValue, oldValue) {
            if (!oldValue)
                oldValue = {};
            if (!newValue)
                newValue = {};
            var keys = Object.keys(oldValue).concat(Object.keys(newValue));
            utilities_4.unique(keys).forEach(function (key) {
                if (utilities_4.hasOwn(oldValue, key) && utilities_4.hasOwn(newValue, key)) {
                    if (oldValue[key] != newValue[key])
                        node.style.setProperty(key, newValue[key]);
                }
                else if (utilities_4.hasOwn(newValue, key))
                    node.style.setProperty(key, newValue[key]);
                else
                    node.style.removeProperty(key);
            });
        };
        ElementUtility.display = function (node, newValue, oldValue) {
            var func = function (val) {
                return {
                    display: val ? 'block' : 'none',
                };
            };
            ElementUtility.style(node, func(newValue), func(oldValue));
        };
        return ElementUtility;
    }());
    exports.ElementUtility = ElementUtility;
});
define("compile", ["require", "exports", "watcher", "mvvm", "utilities", "document"], function (require, exports, watcher_2, mvvm_2, utilities_5, document_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Compile = void 0;
    function isDirective(attr) {
        return attr.indexOf('v-') == 0;
    }
    var parseAnyDirectiveFunction = function (parseString) {
        return function (dir) { return dir.indexOf(parseString) === 0; };
    };
    var isEventDirective = parseAnyDirectiveFunction('on');
    var isTextDirective = parseAnyDirectiveFunction('text');
    var isHtmlDirective = parseAnyDirectiveFunction('html');
    var isModelDirective = parseAnyDirectiveFunction('model');
    var isClassDirective = parseAnyDirectiveFunction('class');
    var isStyleDirective = parseAnyDirectiveFunction('style');
    var isShowDirective = parseAnyDirectiveFunction('show');
    function bindWatcher(node, vm, exp, updater) {
        var val = mvvm_2.getVMVal(vm, exp);
        updater && updater(node, val);
        new watcher_2.Watcher(vm, exp, function (newValue, oldValue) {
            if (newValue === oldValue)
                return;
            updater && updater(node, newValue, oldValue);
        });
    }
    function eventHandler(node, vm, exp, eventType) {
        var fn = vm.$options.methods && vm.$options.methods[exp];
        if (eventType && fn) {
            node.addEventListener(eventType, fn.bind(vm), false);
        }
    }
    var Compile = /** @class */ (function () {
        function Compile(el, vm) {
            this.$vm = vm;
            this.$el = document_1.ElementUtility.isElementNode(el)
                ? el
                : document.querySelector(el);
            if (!this.$el)
                throw '';
            mvvm_2.triggerLifecycleHook(this.$vm, 'beforeMount');
            this.$fragment = document_1.ElementUtility.fragment(this.$el);
            this.compileElement(this.$fragment);
            this.$el.appendChild(this.$fragment);
            mvvm_2.triggerLifecycleHook(this.$vm, 'mounted');
        }
        Compile.prototype.compileElement = function (el) {
            var _this = this;
            var childNodes = el.childNodes;
            childNodes.forEach(function (node) {
                var reg = /\{\{(.*)\}\}/;
                if (document_1.ElementUtility.isElementNode(node))
                    _this.compile(node);
                else if (document_1.ElementUtility.isTextNode(node) &&
                    reg.test(node.textContent))
                    bindWatcher(node, _this.$vm, RegExp.$1.trim(), document_1.ElementUtility.text);
                if (node.childNodes && node.childNodes.length)
                    _this.compileElement(node);
            });
        };
        Compile.prototype.compile = function (node) {
            var _this = this;
            var nodeAttrs = node.attributes;
            utilities_5.toArray(nodeAttrs).forEach(function (attr) {
                var attrName = attr.name;
                if (!isDirective(attrName))
                    return;
                var exp = attr.value;
                var dir = attrName.substring(2);
                if (isEventDirective(dir)) {
                    var eventType = dir.split(':')[1];
                    eventHandler(node, _this.$vm, exp, eventType);
                }
                else if (isTextDirective(dir))
                    bindWatcher(node, _this.$vm, exp, document_1.ElementUtility.text);
                else if (isHtmlDirective(dir))
                    bindWatcher(node, _this.$vm, exp, document_1.ElementUtility.html);
                else if (isClassDirective(dir))
                    bindWatcher(node, _this.$vm, exp, document_1.ElementUtility.class);
                else if (isModelDirective(dir)) {
                    bindWatcher(node, _this.$vm, exp, document_1.ElementUtility.model);
                    var val_1 = mvvm_2.getVMVal(_this.$vm, exp);
                    node.addEventListener('input', function (e) {
                        var target = e.target;
                        var newValue = target.value;
                        if (val_1 === newValue)
                            return;
                        mvvm_2.setVMVal(_this.$vm, exp, newValue);
                        val_1 = newValue;
                    });
                }
                else if (isStyleDirective(dir))
                    bindWatcher(node, _this.$vm, exp, document_1.ElementUtility.style);
                else if (isShowDirective(dir))
                    bindWatcher(node, _this.$vm, exp, document_1.ElementUtility.display);
                node.removeAttribute(attrName);
            });
        };
        return Compile;
    }());
    exports.Compile = Compile;
});
define("index", ["require", "exports", "compile", "dep", "document", "mvvm", "observer", "utilities", "watcher"], function (require, exports, compile_2, dep_3, document_2, mvvm_3, observer_2, utilities_6, watcher_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(compile_2, exports);
    __exportStar(dep_3, exports);
    __exportStar(document_2, exports);
    __exportStar(mvvm_3, exports);
    __exportStar(observer_2, exports);
    __exportStar(utilities_6, exports);
    __exportStar(watcher_3, exports);
});
//# sourceMappingURL=mvvm.js.map