package main

import (
	"fmt"
	"log"

	"github.com/marianogappa/sqlparser"
)

func main() {
	query, err := sqlparser.Parse("SELECT * FROM 'd' WHERE e = '1' AND f > '2'")
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("%+#v\n", query)
}
