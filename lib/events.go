package lib

import "reflect"

type Callback func(interface{})

type EventEmitterCallback struct {
	Callback
	OriginCallback *EventEmitterCallback
}

type EventEmitter struct {
	events map[string][]*EventEmitterCallback
}

func NewEventEmitterCallback(callback Callback) *EventEmitterCallback {
	return &EventEmitterCallback{Callback: callback}
}

func NewEventEmitter() *EventEmitter {
	e := new(EventEmitter)
	e.events = make(map[string][]*EventEmitterCallback, 100)
	return e
}

func (e *EventEmitter) Events() map[string][]*EventEmitterCallback {
	return e.events
}

func (e *EventEmitter) On(eventName string, callback Callback) {
	if _, ok := e.events[eventName]; !ok {
		e.events[eventName] = []*EventEmitterCallback{}
	}
	ec := NewEventEmitterCallback(callback)
	e.events[eventName] = append(e.events[eventName], ec)
}

func (e *EventEmitter) Emit(eventName string, value interface{}) {
	eCallbacks, ok := e.events[eventName]
	if !ok {
		return
	}
	for _, cb := range eCallbacks {
		cb.Callback(value)
	}
}

func Filter(stu []*EventEmitterCallback, f func(s interface{}) bool) []*EventEmitterCallback {
	var r []*EventEmitterCallback
	for _, s := range stu {
		if f(s) == true {
			r = append(r, s)
		}
	}
	return r
}

func (e *EventEmitter) Off(eventName string, callbacks ...Callback) {
	if len(callbacks) != 0 {
		e.events[eventName] = Filter(e.events[eventName], func(v interface{}) bool {
			eCallback := v.(*EventEmitterCallback)
			var eOriginCallbackPointer uintptr
			eCallbackPointer := reflect.ValueOf(eCallback.Callback).Pointer()
			if eCallback.OriginCallback != nil {
				eOriginCallbackPointer = reflect.ValueOf(eCallback.OriginCallback.Callback).Pointer()
			}
			for _, callback := range callbacks {
				callbackPointer := reflect.ValueOf(callback).Pointer()
				if eCallbackPointer == callbackPointer || eOriginCallbackPointer == callbackPointer {
					return false
				}
			}
			return true
		})
	} else {
		delete(e.events, eventName)
	}
}

func (e *EventEmitter) Once(eventName string, callback Callback) {
	var onceCallback *EventEmitterCallback
	onceCallback = NewEventEmitterCallback(func(value interface{}) {
		e.Off(eventName, onceCallback.Callback)
		callback(value)
	})
	onceCallback.OriginCallback = NewEventEmitterCallback(callback)
	if _, ok := e.events[eventName]; !ok {
		e.events[eventName] = []*EventEmitterCallback{}
	}
	e.events[eventName] = append(e.events[eventName], onceCallback)
}
