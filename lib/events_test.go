package lib

import (
	"testing"
)

func TestNewEventEmitterCallback(t *testing.T) {
	a := NewEventEmitterCallback(func(value interface{}) {
		if value.(string) != "a" {
			t.Error()
		}
	})

	a.Callback("a")
}

func TestNewEventEmitter(t *testing.T) {
	a := NewEventEmitter()
	a.On("eventA", func(value interface{}) {
		if value.(string) != "a" {
			t.Error()
		}
	})

	a.Emit("eventA", "a")
}

func TestOn(t *testing.T) {
	a := NewEventEmitter()
	b := NewEventEmitter()
	a.On("eventA", func(value interface{}) {
		if value.(string) != "a" {
			t.Error()
		}
	})
	b.On("eventB", func(value interface{}) {
		if value.(string) != "b" {
			t.Error()
		}
	})

	a.Emit("eventA", "a")
	a.Emit("eventB", "b")
}

func TestEmit(t *testing.T) {
	a := NewEventEmitter()
	i := 0
	a.On("eventA", func(value interface{}) {
		if value.(string) != "a" {
			t.Error()
		}
		i++
	})

	a.Emit("eventA", "a")
	a.Emit("eventA", "a")
	a.Emit("eventA", "a")
	a.Emit("eventA", "a")

	if i != 4 {
		t.Error()
	}
}

func TestOff(t *testing.T) {
	a := NewEventEmitter()
	i := 0
	aNewCallback := func(value interface{}) {
		i--
	}
	a.On("eventA", func(value interface{}) {
		i++
	})
	a.On("eventA", aNewCallback)
	a.Off("eventA", aNewCallback)
	a.Emit("eventA", "")
	if i != 1 {
		t.Error()
	}
}

func TestOnce(t *testing.T) {
	a := NewEventEmitter()
	i := 0
	a.Once("eventA", func(value interface{}) {
		if value.(string) != "a" {
			t.Error()
		}
		i++
	})

	a.Emit("eventA", "a")
	a.Emit("eventA", "a")
	a.Emit("eventA", "a")

	if i != 1 {
		t.Error()
	}
}
