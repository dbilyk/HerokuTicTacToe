const mysql = require("mysql");

module.exports = function () {
  this.connect = () => {
    var con = mysql.createConnection({ host: "dmitribilyk.com", user: "dmitribi_TTT", password: "kar139", database: "dmitribi_nodeTicTacToe" });
    return con;
  }


  this.userAuth = (userCredentials, callback) => {
    let con = this.connect()
    con.query("SELECT " + "* " + "FROM users " + "WHERE " + "username='" + userCredentials.username + "' AND " + "password='" + userCredentials.password + "'", (err, result, fields) => {
      if (err) {
        console.log(err);

      }
      else {
        //no errors, so check if there is such a user 
        if (result.length == 0) {
          callback(false);

        }
        else {
          callback(true, userCredentials.username)

        }
      }
    })
    con.end()
  }

  this.insertNewUser = (userCredentials, uniqueNameCB) => {
    let con = this.connect()
    var query = "SELECT " + "* " + "FROM users " + "WHERE " + "username='" + userCredentials.username + "'";

    con.query(query, (err, result, fields) => {
      if (result.length > 0) {
        uniqueNameCB(false)
        
      }
      else {
        //insert query
        con.query("INSERT INTO users (username,password) VALUES ('" + userCredentials.username + "','" + userCredentials.password + "')", (err, result, fields) => {
          if (err) {
            console.log(err)
          }
          else {
            uniqueNameCB(true);
          }
        })
        con.end()
      }
    })
  }

  

  this.getActivePlayersData = function(usersArr,callback,socket){
    let con = this.connect()
    let returnData =[]
    for(var i=0;i<usersArr.length;i++){
      let query = "SELECT username, wins, losses FROM users WHERE username='"+usersArr[i]+"'"
      con.query(query,(err, res,fields)=>{
        if(err){
          console.log(err) 
        }
        else{
          returnData.push(res[0])
          console.log(usersArr.length === i)
          if(i === usersArr.length){
            callback(returnData,socket)
          }
          
        }
      })
      
    }
    con.end() 
  }




}

