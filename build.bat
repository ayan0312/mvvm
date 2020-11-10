@echo off
set GOARCH=wasm
set GOOS=js
start go build -o ./example/main.wasm main.go