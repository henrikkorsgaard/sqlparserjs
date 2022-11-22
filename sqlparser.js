
const reservedWords = ["SELECT", "FROM", "WHERE"]
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
                    // Additional step to implement "AS" do later
                    if(this.peek().toUpperCase() == "FROM"){
                        this.steps.indexOf("stepSelectFrom")
                        break
                    }
                    this.steps.indexOf("stepSelectComma")
                    break;
                case "stepSelectComma":
                    let comma = this.peek()
                    if(comma != ","){
                        run = false
                        console.log("Error here because we did not get comma and next word cannot be keyword because we already skipped that step above. Hence, an error is needed")
                    }
                    //WE NEED TO SEPERATE POP HERE BECAUSE WE ARE DOING BOTH CHECKS AND IDENTIFICATION WITH PEEK. AND SOMETHMES WE JUST CHECK AND DON'T WANT TO REMOVE STUFF
                    this.steps.indexOf("stepSelectField") //if there is a comma, we expect the next field. 
                    break 
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
        let peeked = ""
        let len = 0
        if(this.index < this.sql.length){
            reservedWords.every(w => {
                
                let token = this.sql.substring(this.index,w.length)
                if(w == token){
                    peeked = token
                    len = token.length
                    return true
                }
            })
        }

        if(peeked == "" && this.sql[this.index] == '\''){
            //Future special case
        }

        if(peeked == ""){
            for(var i = this.index; i < this.sql.length;i++){
                if(this.sql[i].match(indentifierRegExp)){ //there is some mombo
                    peeked = this.sql[this.index, i]
                    len = this.sql[this.index, i].length
                    break;
                }
            }
        }

        this.index += len
        //deal with with the whitespace
        for(;this.index < this.sql.length && this.sql[this.index] == ' '; this.index++){}
        // we might need to handle quoited strings per golang example l. 402
        return peeked
    }
}

p = new SQLParser()
p.parse("SELECT * FROM table WHERE id=2")