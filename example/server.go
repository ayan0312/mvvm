package main

import (
	"log"
	"net/http"
	"strings"
)

func main() {
	log.Printf("listening on %q...", "localhost:8000")
	handler := http.HandlerFunc(func(resp http.ResponseWriter, req *http.Request) {
		if strings.HasSuffix(req.URL.Path, ".wasm") {
			resp.Header().Set("content-type", "application/wasm")
		}

		http.FileServer(http.Dir("./")).ServeHTTP(resp, req)
	})
	log.Fatal(http.ListenAndServe("localhost:8000", handler))
}
