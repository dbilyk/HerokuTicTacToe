const express = require("express")

function roomRoutes(){
  router = express.Router()

  router.get("/",(req,res)=>{
    res.render("./rooms.pug")
  })

  

  return router;
}


module.exports = roomRoutes;