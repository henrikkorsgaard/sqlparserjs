

const indentifierRegExp = new RegExp('[a-zA-Z0-9_*]');

class SQLException {
    constructor(err) {
        this.message = err
        this.name = "SQLException"
    }
}

/*
Without any help:
    - SELECT name FROM master.sys.databases 
    - SQL: SELECT * FROM tables;
    - SQL: SELECT * FROM Information_SCHEMA.colums WHERE tableName = 'tablename';
    - SQL: SELECT * FROM table; become an instrument for data discovery

*/

class Condition {

    //SQL interprets string comparisons (<,>, <=, >=) different than Javascript.
    //SQL compare by alphabetical order,  JavaScript by string lenght. 
    //TODO: This can be fixed by using typecheck (ugh) and sort in the relevant funcitons
    static operations = {
        "Eq": {
            "SQL": "=",
            "f": function (a, b) { return a == b }
        },
        "Ne": {
            "SQL": "!=",
            "f": function (a, b) { return a != b },
        },
        "Gt": {
            "SQL": ">",
            "f": function (a, b) { return a > b },
        },
        "Lt": {
            "SQL": "<",
            "f": function (a, b) { return a < b },
        },
        "Gte": {
            "SQL": ">=",
            "f": function (a, b) { return a >= b },
        },
        "Lte": {
            "SQL": "<=",
            "f": function (a, b) { return a <= b },
        }
    }

    static supportedOperations = [">=", "<=", "!=", "=", ">", "<"]

    constructor(field) {
        this.field = field
        this.data = ""
        this.operatorFunction = null
    }
}

class Query {
    constructor() {
        this.type = ""
        this.tableName = ""
        this.fields = []
        this.conditions = []
    }
}

class SQLParser {
    static KEYWORDS = ["SELECT", "FROM", "WHERE", ",", ">=", "<=", "!=", "=", ">", "<"]
    static steps = ["stepType",
        "stepSelectField",
        "stepSelectComma",
        "stepSelectFrom",
        "stepSelectFromTable",
        "stepWhere",
        "stepWhereField",
        "stepWhereOperator",
        "stepWhereValue",
        "stepWhereAnd"]
    constructor() {
    }

    /*
        TODO:
        - RETURN QUERY AT EACH STEP
            - ah, this became a rabbit hole
            - import from csv -> table and sql'able object
            - then we need basic database and table meta data to support poking query
            - ... and then we are set to do something interesting.

        - VALIDATION
        - COVERAGE
        - TESTS?
    */

    generateAutoCompleteSuggestions(table, fieldsArray, fieldsValueObject) {
        keywordThree = [
            {
                "step": SQLParser.steps.indexOf("stepType"),
                "options": ["SELECT"]
            },
            {
                "step": SQLParser.steps.indexOf("stepSelectField"),
                "options": [...fieldsArray, "*"]
            },
            {
                "step": SQLParser.steps.indexOf("stepSelectComman"),
                "options": [","]
            },
            {
                "step": SQLParser.steps.indexOf("stepSelectFrom"),
                "options": ["FROM"]
            },
            {
                "step": SQLParser.steps.indexOf("stepSelectFromTable"),
                "options": [table]
            },
            {
                "step": SQLParser.steps.indexOf("stepSelectWhere"),
                "options": ["WHERE"]
            },
            {
                "step": SQLParser.steps.indexOf("stepSelectField"),
                "options": fields
            },
            {
                "step": SQLParser.steps.indexOf("stepSelectOperator"),
                "options": supportedOperations
            },
            //Note, we cannot sugget any values for the step: stepWhereValue, without having analysed the entire database.
            //Might be interesting for a toy example -- lets try
            {
                "step": SQLParser.steps.indexOf("stepSelectOperator"),
                "options": supportedOperations
            },

            {
                "step": SQLParser.steps.indexOf("stepSelectWhereAnd"),
                "options": ["AND"]
            },
        ]
    }

    parse(sql) {
        this.sql = sql
        this.index = 0
        this.step = 0
        this.query = new Query()

        if (this.sql[this.sql.length - 1] != ";") {
            throw new SQLException("SQL statement does not end with a ;")
        }
        while (true) {
            if (this.sql[this.index] == ";") {
                return this.query
            }
            switch (SQLParser.steps[this.step]) {
                case "stepType":
                    switch (this.peek().toUpperCase()) {
                        case "SELECT":
                            this.query.type = "SELECT"
                            this.pop()
                            this.step = SQLParser.steps.indexOf("stepSelectField")
                            break;
                        default:
                            throw new SQLException("Invalid query type")
                    }
                    break;
                case "stepSelectField":
                    let identifier = this.peek()
                    this.query.fields.push(identifier)
                    this.pop()
                    // Additional step to implement "AS" do later
                    if (this.peek().toUpperCase() == "FROM") {
                        this.step = SQLParser.steps.indexOf("stepSelectFrom")
                        break
                    }
                    this.step = SQLParser.steps.indexOf("stepSelectComma")
                    break;
                case "stepSelectComma":
                    let comma = this.peek()
                    if (comma != ",") {
                        throw new SQLException(`Invalide query: ${this.sql}. Something went wrong around string index ${this.index}: ${this.sql.substring(0, this.index)}! Expected a comma or keyword.`)
                    }
                    this.pop()
                    this.step = SQLParser.steps.indexOf("stepSelectField")
                    break
                case "stepSelectFrom":
                    let from = this.peek().toUpperCase()
                    if (from != "FROM") {
                        throw new SQLException(`Invalide query: ${this.sql}. Something went wrong around string index ${this.index}: ${this.sql.substring(0, this.index)}! Expected keyword FROM.`)
                    }
                    this.pop()
                    this.step = SQLParser.steps.indexOf("stepSelectFromTable")
                    break
                case "stepSelectFromTable":
                    let tableName = this.peek()
                    if (tableName.length == 0) {
                        throw new SQLException(`Invalide query: ${this.sql}. Something went wrong around string index ${this.index}: ${this.sql.substring(0, this.index)}! Expected tableName returned empty.`)
                    }
                    this.query.tableName = tableName
                    this.pop()
                    this.step = SQLParser.steps.indexOf("stepWhere")
                    break
                case "stepWhere":
                    let whereWord = this.peek()
                    if (whereWord.toUpperCase() != "WHERE") {
                        throw new SQLException(`Invalide query: ${this.sql}. Something went wrong around string index ${this.index}: ${this.sql.substring(0, this.index)}! Expected a WHERE clause (or ;)`)
                    }
                    this.pop()
                    this.step = SQLParser.steps.indexOf("stepWhereField")
                    break
                case "stepWhereField": {
                    let field = this.peek()
                    //We assume that all conditions are given field first (field = condition)
                    // condition = field is also valid in SQL, but not supported in this toy example
                    let condition = new Condition(field)
                    this.query.conditions.push(condition)
                    this.pop()
                    this.step = SQLParser.steps.indexOf("stepWhereOperator")
                    break
                }
                case "stepWhereOperator":
                    let operator = this.peek()
                    let curCondition = this.query.conditions[this.query.conditions.length - 1]
                    switch (operator) {
                        case "=":
                            curCondition.operator = Condition.operations["Eq"]
                            break
                        case ">":
                            curCondition.operator = Condition.operations["Gt"]
                            break
                        case ">=":
                            curCondition.operator = Condition.operations["Gte"]
                            break
                        case "<":
                            curCondition.operator = Condition.operations["Lt"]
                            break
                        case "<=":
                            curCondition.operator = Condition.operations["Lte"]
                            break
                        case "!=":
                            curCondition.operator = Condition.operations["Ne"]
                            break
                        default:
                            throw new SQLException(`Invalide query: ${this.sql}. The provided condition (${condition}) is not supported!`)
                            break
                    }
                    this.query.conditions[this.query.conditions.length - 1] = curCondition
                    this.pop()
                    this.step = SQLParser.steps.indexOf("stepWhereValue")
                    break
                case "stepWhereValue": {
                    let data = this.peek()
                    let curCondition = this.query.conditions[this.query.conditions.length - 1]
                    curCondition.data = data
                    this.query.conditions[this.query.conditions.length - 1] = curCondition
                    this.pop()
                    this.step = SQLParser.steps.indexOf("stepWhereAnd")
                    break;
                }
                case "stepWhereAnd":
                    let andWord = this.peek()
                    if (andWord.toUpperCase() != "AND") {
                        console.log("error must handle")
                    }
                    this.pop()
                    this.step = SQLParser.steps.indexOf("stepWhereField")
                    break;
                default:
                    throw new SQLException(`Critical: Unknown SQL error on ${this.sql}. Expected statement termination or something else.`)
                    return
            }
        }
    }


    peek() {
        return this.peekCases()[0]
    }

    pop() {
        //We pop via the index and not on the original SQL statement
        let peekedLength = this.peekCases()
        let peeked = peekedLength[0]
        this.index += peekedLength[1]
        //Here we deal with the whitespace
        for (; this.index < this.sql.length && this.sql[this.index] == ' '; this.index++) { }
        return
    }

    peekCases() {
        if (this.index >= this.sql.length) {
            return ["", 0]
        }

        for (var i = 0; i < SQLParser.KEYWORDS.length; i++) {
            let w = SQLParser.KEYWORDS[i]

            let token = this.sql.substring(this.index, this.index + w.length)
            if (w == token) {
                return [token, token.length]
            }
        }

        if (this.sql[this.index] == '\'') {
            return this.peekQuotedString()

        }

        return this.peekIdentifier()
    }

    peekIdentifier() {

        for (var i = this.index; i < this.sql.length; i++) {
            if (!this.sql[i].match(indentifierRegExp)) {
                let identifier = this.sql.substring(this.index, i)
                return [identifier, identifier.length]
            }
        }

        let identifier = [this.index, this.sql.length - 1]

        return [identifier, identifier.length]
    }

    peekQuotedString() {
        if (this.sql.length < this.index || this.sql[this.index] != '\'') {
            return ["", 0]
        }

        for (var i = this.index + 1; i < this.sql.length; i++) {
            if (this.sql[i] == '\'' && this.sql[i - 1] != '\\') {
                let identifier = this.sql.substring(this.index + 1, i)
                return [identifier, identifier.length + 2]
            }
        }

        return ["", 0]
    }

    validate() {
        //Consider implementing validation (per golang example) if needing something more elaborate
    }
}

class Database {

    constructor() {
        this.tables = []
    }

    insertFromCSV(csvfile) {
        //This requires running python3 -m http.server
        //Or on the server
        let xhr = new XMLHttpRequest()
        let tables = this.tables //Silly double scope "this" issue
        xhr.onload = function () {
            let data = xhr.responseText
            let rows = data.split(/\r?\n|\r/);
            let table = {
                name: csvfile.replace(".csv", ""),
                fields: [...rows[0].split(",")],
                rows: [],
                columnIndex: []
            }
            
            let fields = rows[0].split(",")
            for (var i = 0, n = fields.length; i < n; i++) {
                table.columnIndex.push({ "field": fields[i], "vals": [] })
            }

            for (var i = 1, n = rows.length; i < n; i++) {
                let fields = rows[i].split(",")
                
                table.rows.push(fields)
                for (var j = 0, m = fields.length; j < m; j++) {
                    table.columnIndex[j].vals.push(fields[j])
                }
            }
            console.log(table.rows)
            tables.push(table)
        }

        xhr.open("get", "http://localhost:8000/books.csv", false)
        xhr.send()
    }

    generateHTMLTableFromDBTable(tableName){
        let table;
        for(var i = 0, n=this.tables.length; i < n; i++){
            console.log(this.tables[i])
            if(this.tables[i].name == tableName){
                table = this.tables[i]
                break;
            }
        }

        var html = document.createElement("table")
        html.id = table.name
        console.log(table.rows)
        //Wait with this
        //html.dataset.columnIndex = table.columnIndex
        let thead = document.createElement("thead")
        html.appendChild(thead)
        let thrw = document.createElement("tr")
        

        for(var i = 0, n=table.fields.length; i < n; i++){
            thrw.innerHTML += `<th>${table.fields[i]}</th>`
        }

        thead.appendChild(thrw)
        let tbody = document.createElement("tbody")
        html.appendChild(tbody)
        for(var i = 0, n=table.rows.length; i < n; i++){
            let tdrw = document.createElement("tr")
            for(var j = 0, m = table.rows[i].length; j < m;j++){
                tdrw.innerHTML += `<td>${table.rows[i][j]}</td>`
            }
            console.log(tdrw)
            tbody.append(tdrw)
        }

        return html
    }

    querySQL(sql){
        //THIS IS EXCITING
    }
    //We can either query on this or query on HTML products
}





