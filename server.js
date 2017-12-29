const express = require("express")
const app = express()
const server = require("http").createServer(app)
const path = require("path")
const sass = require("node-sass-middleware")

app.set("views", path.join(__dirname,"/views"))
app.set("view engine","pug")
app.use(sass({
  src: path.join(__dirname,"sass"),
  dest: path.join(__dirname,"public/stylesheets"),
  outputStyle: "compressed"

}))
app.use(express.static("/public"))

app.get("/",(req,res)=>{
  
   
  res.render(path.join(__dirname,"views/rooms.pug"));
})

server.listen(3000,"localhost",()=> console.log("server started"))