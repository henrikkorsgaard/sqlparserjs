
const reservedWords = ["SELECT","FROM", "WHERE", ">=", "<=", "!=", ",", "=", ">", "<"]
const steps = ["stepType", "stepSelectField", "stepSelectFrom","stepSelectComma","stepSelectFromTable", "stepWhere", "stepWhereField", "stepWhereOperator","stepWhereValue", "stepWhereAnd"]

const indentifierRegExp = new RegExp('[a-zA-Z0-9_*]'); 

class SQLException {
    constructor(err){
        this.message = err
        this.name = "SQLException"
    }
}

class Condition {
    
    static Unknown = 0
    static Eq = 1
    static Ne = 2
    static Gt = 3
    static Lt = 4
    static Gte = 5
    static Lte = 6

    constructor(firstCondition){
        this.firstCondition = firstCondition
        this.secondCondition = ""
        this.operator = 0
    }
}

class Query {
    constructor(){
        this.type = ""
        this.tableName = ""
        this.fields = []
        this.conditions = []
    }
}

class SQLParser {
    constructor(){
        this.index = 0
        this.sql = ""
        this.step = 0
        this.query = new Query()
        this.err = null
    }

    parse(sql){
        this.sql = sql
        if(this.sql[this.sql.length-1] != ";"){
            throw new SQLException("SQL statement does not end with a ;")
            return
        }
        let run = true
        while (run) {        
            if(this.sql[this.index] == ";") {
                return this.query
            }
            console.log("running here", steps[this.step])
            switch(steps[this.step]) {
                case "stepType":
                    switch(this.peek().toUpperCase()){
                        case "SELECT":
                            this.query.type = "SELECT"
                            this.pop()
                            this.step = steps.indexOf("stepSelectField")
                            break;
                        default: 
                            console.log("we need to throw an error here")
                            run = false
                            return 
                    }
                    break;
                case "stepSelectField":
                    let identifier = this.peek()
                    // the other library does an additional check here, but I don't know why
                    this.query.fields.push(identifier)
                    this.pop()
                    // Additional step to implement "AS" do later
                    if(this.peek().toUpperCase() == "FROM"){
                        this.step = steps.indexOf("stepSelectFrom")
                        break
                    }
                    this.step = steps.indexOf("stepSelectComma")
                    break;
                case "stepSelectComma":
                    let comma = this.peek()
                    if(comma != ","){
                        run = false
                        console.log("Error here because we did not get comma and next word cannot be keyword because we already skipped that step above. Hence, an error is needed")
                    }
                    this.pop()
                    this.step = steps.indexOf("stepSelectField")
                    break
                case "stepSelectFrom":
                    let from = this.peek().toUpperCase()
                    if(from != "FROM"){
                        console.log("this should never happen")
                        run = false
                        break
                    }
                    this.pop()
                    this.step = steps.indexOf("stepSelectFromTable")
                    break
                case "stepSelectFromTable":
                    let tableName = this.peek()
                    if(tableName.length == 0){
                        console.log("errorhandling is for later, eh")
                        run = false
                        break;
                    }
                    this.query.tableName = tableName
                    this.pop()
                    this.step = steps.indexOf("stepWhere")
                    break
                case "stepWhere":
                    let whereWord = this.peek()
                    if(whereWord.toUpperCase() != "WHERE"){
                        console.log("again, a very unlikely that this is not WHERE")
                        run = false
                        break
                    }
                    this.pop()
                    this.step = steps.indexOf("stepWhereField")
                    break
                case "stepWhereField": {
                    let identifier = this.peek()
                    let condition = new Condition(identifier)
                    this.query.conditions.push(condition)
                    this.pop()
                    this.step = steps.indexOf("stepWhereOperator")
                    break
                    }
                case "stepWhereOperator":
                    let operator = this.peek()
                    let currentCondition = this.query.conditions[this.query.conditions.length-1]
                    switch(operator){
                        case "=":
                            currentCondition.operator = Condition.Eq
                            break
                        case ">":
                            currentCondition.operator = Condition.Gt
                            break
                        case ">=":
                            currentCondition.operator = Condition.Gte
                            break
                        case "<":
                            currentCondition.operator = Condition.Lt
                            break
                        case "<=":
                            currentCondition.operator = Condition.Lte
                            break
                        case "!=":
                            currentCondition.operator = Condition.Ne
                            break
                        default:
                            console.log("another error")
                            run = false
                            break
                    }
                    this.query.conditions[this.query.conditions.length-1] = currentCondition
                    this.pop()
                    this.step = steps.indexOf("stepWhereValue")
                    break
                case "stepWhereValue": { 
                        let identifier = this.peek()
                        let currentCondition = this.query.conditions[this.query.conditions.length-1]
                        currentCondition.secondCondition = identifier
                        this.query.conditions[this.query.conditions.length-1] = currentCondition
                        this.pop()
                        break;
                    }
                default:
                    console.log("we need another error here")
                    run = false
                    return
            }
        }
    }
    
    peek() {
        return this.peekCases()
    }

    pop(){
        let peeked = this.peekCases()
        this.index += peeked.length
        //deal with with the whitespace
        for(;this.index < this.sql.length && this.sql[this.index] == ' '; this.index++){}
        return
    }

    peekCases(){
        if(this.index >= this.sql.length){
            return peeked
        }
        
        for(var i = 0; i < reservedWords.length; i++){
            let w = reservedWords[i]
            
            let token = this.sql.substring(this.index,this.index + w.length)
            if(w == token){
                return token
            }
        }
        
        if(this.sql[this.index] == '\''){
            //Future special case
            return ""
                
        }
        return this.peekIdentifier()
    }

    peekIdentifier(){
     
        for(var i = this.index; i < this.sql.length;i++){
            if(!this.sql[i].match(indentifierRegExp)){ //there is some mombo
                return this.sql.substring(this.index,i)
            }
        }
        return this.sql[this.index, this.sql.length-1]
    }

    peekQuotedString(){}

}

