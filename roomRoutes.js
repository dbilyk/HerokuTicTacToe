const express = require("express")
const database = require("./models")
const db = new database();
const hash = require("hashids")
var HASH = new hash()
function challenge(target, requester) {
  this.target = target;
  this.requester = requester;

}

function User(username, socket) {
  this.username = username;
  this.socket = socket;
}

function turnData(roomID, pos) {
  this.roomID = roomID;
  this.opponentStatus = pos;

}
//array of {username:"somename",id:"socketid"}
var currentUsers = [];
var usernameList = () => currentUsers.map(e => e.username)
// [{requester:socketID, target: socketID}]
var activeChallenges = []
var activeGames = []

function Game(socketA, socketB, io) {
  var IO = io;
  var idSet = false;
  var socketA = socketA
  var socketB = socketB
  var totalTurns = 0;

  this.roomID;
  this.getA = () => socketA
  this.getB = () => socketB

  this.p1 = { positions: [0, 0, 0, 0, 0, 0, 0, 0, 0], myTurn: true }
  this.p2 = { positions: [0, 0, 0, 0, 0, 0, 0, 0, 0], myTurn: false }


  function checkForWin(array) {
    winCases =
      [[1, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 0, 1, 0, 0, 1, 0, 0],
      [0, 1, 0, 0, 1, 0, 0, 1, 0],
      [0, 0, 1, 0, 0, 1, 0, 0, 1],
      [1, 1, 1, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 1, 1, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 1, 1, 1],
      [0, 0, 1, 0, 1, 0, 1, 0, 0]]

    var winCount = 0;
    var count = 0;
    var won = false;
    winCases.forEach((_, i) => {
      winCases[i].forEach((__, j) => {
        if (__ == 1 && array[j] == 1) {
          winCount++;

          if (winCount == 3) won = true;

        }
        count++;
        if (count > 8) {
          count = 0;
          winCount = 0;
        }
      })
    })
    return won;
  }
  //join sockets to room
  function roomIDSetCallback() {
    if (socketA) socketA.join(this.roomID)
    else IO.to(socketB.id).emit("error")
    if (socketB) socketB.join(this.roomID)
    else IO.to(socketA.id).emit("error")
  }
  //called once to push blank state to clients
  this.setUpGame = function () {
    if (this.roomID) {
      var initDataA = new turnData(this.roomID, this.p1)
      var initDataB = new turnData(this.roomID, this.p2)
      io.to(socketA.id).emit("gameSetup", initDataA)
      io.to(socketB.id).emit("gameSetup", initDataB)
    }
  }

  //set encoded id based on array index for easy lookup
  this.setRoomID = (arrayLoc) => {
    if (!idSet) {
      this.roomID = HASH.encode(arrayLoc);
      roomIDSetCallback()
      idSet = true;
    }
  }

  this.newInput = function (socket, pos) {
    var targetData, target, callerData, caller
    if (socket.id == socketA.id) {
      targetData = this.p2;
      target = socketB;
      callerData = this.p1;
      caller = socketA;
    }
    else {
      targetData = this.p1
      target = socketA;
      callerData = this.p2;
      caller = socketB;
    }
    //if its this socket's turn
    if (callerData.myTurn) {
      if (targetData.positions[pos] == 0) {
        callerData.positions[pos] = 1;
        //check for win
        if (checkForWin(callerData.positions) && totalTurns <= 9) {

          io.to(caller.id).emit("youWon", pos)

          io.to(target.id).emit("youLost", pos)
        }
        else {
          socket.to(target.id).emit("playTurn", pos)
          callerData.myTurn = false;
          targetData.myTurn = true;
          totalTurns++
          console.log(totalTurns)
          if (totalTurns == 9) {
            io.to(caller.id).emit("draw")
            db.getActivePlayersData(usernameList(),onActiveUserData,caller);
            io.to(target.id).emit("draw")
            db.getActivePlayersData(usernameList(),onActiveUserData,target);

          }
        }

      }
    }

  }
  this.opponentLeft = function (socket) {

  }

}


module.exports = function (io) {
  router = express.Router()

  //send the home rooms view to client
  router.get("/", (req, res) => {
    res.render("./rooms.pug")
  })



  function findSocketFromUsername(username) {
    var targetUserData = currentUsers.find(e => e.username == username)
    return (targetUserData) ? targetUserData.socket : false;
  }

  function findUsernameFromSocket(socket) {
    var targetUserData = currentUsers.find(e => e.socket.id == socket.id)

    return (targetUserData) ? targetUserData.username : false;
  }

  function findChallenge(userSocketID) {
    var index = activeChallenges.findIndex((e) => {
      return (e.target.id == userSocketID || e.requester.id == userSocketID)
    })
    return { index: index, object: activeChallenges[index] }
  }

  function findEmptyIndex(gameArr) {
    var i = gameArr.findIndex((e) => undefined);
    return (i == -1) ? gameArr.length : i
  }
  //socket io connection
  io.on('connection', (socket) => {

    //send a welcome event
    socket.emit("welcome", "connected through the roomRoutes File!")
    db.getActivePlayersData(usernameList(), onActiveUserData)
    
    socket.on("updateLobby", () => {
      db.getActivePlayersData(usernameList(),onActiveUserData,socket)
    })
    
    //testing
    function onActiveUserData(data,socket) {
      if(socket){
        io.to(socket.id).emit("updateLobby", data);
      }
      else{
        io.sockets.emit("updateLobby",data)
      }
    }
    
    
    //client request login
    socket.on('loginRequest', (credentials) => {
      db.userAuth(credentials, loggedIn);
      
    })
    
    //login result
    function loggedIn(bool, user) {
      //check if user has already logged in elsewhere.
      if (currentUsers.findIndex(e => e.username == user) == -1) {
        socket.emit('loginResult', bool, user)
        if (bool) {
          currentUsers.push(new User(user, socket))
          //testing
          db.getActivePlayersData(usernameList(), onActiveUserData)
        }
      }
    }

    //client request signup
    socket.on('signupRequest', (data) => {
      //callback only fired on success with a bool arg
      db.insertNewUser(data, signedUp)
    })

    //signup result
    function signedUp(bool) {
      socket.emit('signupResult', bool);
    }

    //someone challenged someone else
    socket.on('newChallenge', (targetUser, callingUser) => {
      let targetSocket = findSocketFromUsername(targetUser)
      let callingSocket = findSocketFromUsername(callingUser)
      if (targetSocket) {
        let newChallenge = new challenge(targetSocket, callingSocket)
        activeChallenges.push(newChallenge)
        socket.to(targetSocket.id).emit("newChallenge", callingUser)


      }
    })




    //pass answer to relevant socket
    socket.on("challengeResponse", (accepted, username) => {

      let thisChallenge = findChallenge(socket.id)

      if (thisChallenge.index != -1) {
        socket.to(thisChallenge.object.requester.id).emit("challengeResponse", accepted, username)

      }
      else {
        socket.to(socket.id).emit("error")
      }


      if (accepted) {
        var newGame = new Game(socket, thisChallenge.object.requester, io)
        var emptyIndex = findEmptyIndex(activeGames)
        activeGames.splice(emptyIndex, 0, newGame)
        newGame.setRoomID(emptyIndex)
        newGame.setUpGame()
        activeChallenges.splice(thisChallenge.index, 1)


      }
      else {
        activeChallenges.splice(thisChallenge.index, 1)
      }


    })

    socket.on("cancelChallenge", () => {
      var challenge = findChallenge(socket.id);
      if (challenge.index != -1) {
        var requesterUsername = findUsernameFromSocket(challenge.object.requester)
        socket.to(challenge.object.target.id).emit("cancelChallenge", requesterUsername)
      } else {
        io.to(socket.id).emit("error")
      }
      db.getActivePlayersData(usernameList(),onActiveUserData)
      activeChallenges.splice(challenge.index, 1)

    })



    //some player hit X
    socket.on("playTurn", (object) => {
      var index = HASH.decode(object.roomID)[0];
      var targetGame = activeGames[index]
      targetGame.newInput(socket, object.position)


    })



    //disconnect
    socket.on("disconnect", (data) => {
      let playerStillInGame
      //find games that player was in and abort them
      var cancelledGame = activeGames.find((e) => {
        if (!e.getA().connected) {
          playerStillInGame = e.getB()
          return true;
        }
        if (!e.getB().connected) {
          playerStillInGame = e.getA()
          return true;
        }
      })

      //if a player is still in a game with this user...
      if (playerStillInGame) {
        io.to(playerStillInGame.id).emit('draw')
        delete cancelledGame
        db.getActivePlayersData(usernameList(),onActiveUserData)
      }

      var abandonedChallenges = activeChallenges.filter((e) => {
        return e.requester.id == socket.id
      })
      if (abandonedChallenges) {
        for (var i = 0; i < abandonedChallenges.length; i++) {
          var id = abandonedChallenges[i].target.id;
          io.to(id).emit("cancelChallenge", findUsernameFromSocket(socket))
          var chalIndex = activeChallenges.findIndex((e) => {
            try {
              return (e.object.target.id == socket.id || e.object.requester.id == socket.id)

            }
            catch (e) {
              return false
            }
          })
          activeChallenges.splice(chalIndex, 1)
        }
      }



      let indexToRemove = currentUsers.findIndex(e => e.socket.id == socket.id)
      if (indexToRemove != -1) currentUsers.splice(indexToRemove, 1);
        db.getActivePlayersData(usernameList(),onActiveUserData)
    })



  })




  return router;
}
