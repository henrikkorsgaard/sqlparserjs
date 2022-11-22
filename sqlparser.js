
const reservedWords = ["SELECT","FROM", "WHERE"]
const steps = ["stepType", "stepSelectField", "stepSelectFrom","stepSelectComma","stepSelectFromTable", "stepWhere", "stepWhereField", "stepWhereOperator","stepWhereValue", "stepWhereAnd"]

const indentifierRegExp = new RegExp('[a-zA-Z0-9_*]'); 

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
        console.log(sql)
        this.sql = sql
        let run = true
        while (run) {
            
            if(this.index >= this.sql.length) {
                return this.query
            }
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
                    console.log(identifier)
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
                    console.log(tableName)
                    this.pop()
                    this.step = steps.indexOf("stepWhere")
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
                case "stepWhereField":
                    identifier = this.peek()
                    //this.query.conditions.push() // I NEED TO FIGURE THIS OUT
                    this.pop()
                    this.step = steps.indexOf("stepWhereOperator")
                    break
                case "stepWhereOperator"
                default:
                    console.log(steps[this.step])
                    console.log("we need another error here")
                    run = false
                    return
            }
        }
    }

    //we need to follow the proper methods from the reference implementation.
    //peek, peekwithlength, pop, etc. 

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
        console.log("never expected to get this far eh")
        return this.sql[this.index, this.sql.length]
    }

    peekQuotedString(){}
}



p = new SQLParser()
p.parse("SELECT * FROM table WHERE id=2")