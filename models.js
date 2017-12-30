const mysql = require("mysql");

module.exports = function () {
  var con = mysql.createConnection({ host: "dmitribilyk.com", user: "dmitribi_TTT", password: "kar139", database: "dmitribi_nodeTicTacToe" });
  this.connect = () => {
    con.connect((err) => {
      if (err) return err
      else return true
    })
  }

  this.userAuth = (userCredentials, callback) => {
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
          console.log(result)
          callback(true)

        }
      }
    })
  }

  this.insertNewUser = (userCredentials, callback) => {
    var query = "SELECT " + "* " + "FROM users " + "WHERE " + "username='" + userCredentials.username + "'";

    con.query(query, (err, result, fields) => {
      if (result.length > 0) {
        callback(false)
        
      }
      else {
        //insert query
        con.query("INSERT INTO users (username,password) VALUES ('"+userCredentials.username +"','"+userCredentials.password+"')", (err, result, fields) => {
          if (err) {
            console.log(err)
          }
          else {
            callback(true);
          }
        })

      }




    })

    //con.query("INSERT INTO users (username,score) VALUES ('ronburgundy','1000000');");
    //con.query("DELETE FROM users WHERE username='ronburgundy'");

  }






}

