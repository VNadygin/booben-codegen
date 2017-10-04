class ImportAst {
  constructor() {
    this.ast = []
  }
  addImport(ast) {
    this.ast = [
      ...this.ast,
      ast
    ]
  }
  value(){
    return this.ast
  }
}

const importAst = new ImportAst()
importAst.addImport({type: 'StringValue'})
console.log(importAst.value());


