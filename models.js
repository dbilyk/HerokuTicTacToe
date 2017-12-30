const mysql = require("mysql");

var con = mysql.createConnection({ host: "dmitribilyk.com", user: "dmitribi_TTT", password: "kar139", database: "dmitribi_nodeTicTacToe" });
con.connect((err) => {
  if (err) {
    console.log(err)
  }
  else {
    console.log("successfully connected to database!")
  }

  con.query("SELECT * FROM users", (err, result, fields) => {
    console.log(err + "\n" + JSON.stringify(result) + "\n" + JSON.stringify(fields));


  })
  //con.query("INSERT INTO users (username,score) VALUES ('ronburgundy','1000000');");
  //con.query("DELETE FROM users WHERE username='ronburgundy'");

})