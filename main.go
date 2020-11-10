package main

import (
	"main/lib"
	"sync"
	"syscall/js"
)

var window = js.Global()

func main() {
	var wg sync.WaitGroup

	window.Set("GoRelease", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		wg.Done()
		return true
	}))

	window.Set("EventEmitter", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		var scope js.Value

		prototype := this

		if len(args) > 0 {
			scope = args[0]
		}

		e := lib.NewEventEmitter()
		prototype.Set("scope", scope)
		prototype.Set("on", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
			wg.Add(1)
			defer wg.Done()

			if len(args) != 2 {
				return false
			}

			e.On(args[0].String(), func(value interface{}) {
				args[1].Call("call", scope, value)
			})

			return true
		}))

		prototype.Set("emit", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
			wg.Add(1)
			defer wg.Done()

			if len(args) != 2 {
				return false
			}

			e.Emit(args[0].String(), args[1])

			return true
		}))

		prototype.Set("once", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
			wg.Add(1)
			defer wg.Done()

			if len(args) != 2 {
				return false
			}

			e.Once(args[0].String(), func(value interface{}) {
				args[1].Call("call", scope, value)
			})

			return true
		}))

		return nil
	}))

	wg.Add(1)
	wg.Wait()
}
