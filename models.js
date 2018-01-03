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
          callback(true,userCredentials.username)

        }
        con.destroy();
      }
    })
  }

  this.insertNewUser = (userCredentials, callback) => {
    let con = this.connect()
    var query = "SELECT " + "* " + "FROM users " + "WHERE " + "username='" + userCredentials.username + "'";

    con.query(query, (err, result, fields) => {
      if (result.length > 0) {
        callback(false)
        con.destroy() 
      }
      else {
        //insert query
        con.query("INSERT INTO users (username,password) VALUES ('"+userCredentials.username +"','"+userCredentials.password+"')", (err, result, fields) => {
          if (err) {
            console.log(err)
          }
          else {
            callback(true);
            con.destroy()
          }
        })

      }




    })

    //con.query("INSERT INTO users (username,score) VALUES ('ronburgundy','1000000');");
    //con.query("DELETE FROM users WHERE username='ronburgundy'");

  }






}

