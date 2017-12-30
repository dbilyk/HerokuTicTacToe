const express = require("express")
const app = express()
const server = require("http").createServer(app)
const io = require("socket.io")(server)
const path = require("path")
const sass = require("node-sass-middleware")
const roomRoutes = require("./roomRoutes")(io)

server.listen(3000, "localhost", () => console.log("server started"))
app.set("views", path.join(__dirname, "/views"))
app.set("view engine", "pug")
app.use(sass({
  src: path.join(__dirname, "sass"),
  dest: path.join(__dirname, "public/stylesheets"),
  outputStyle: "compressed"

}))
app.use(express.static(path.join(__dirname, "/public"), { dotfiles: "allow" }))
app.use(express.static(path.join(__dirname, "/public/stylesheets"), { dotfiles: "allow" }))
app.use('/', roomRoutes)



