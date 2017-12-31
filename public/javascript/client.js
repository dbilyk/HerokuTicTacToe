function ClientRoutes() {
  const view = new ViewHandlers()
  this.username = ""
  var socket = io.connect("192.168.50.236:3000");
  //when we successfully connect to our node socket server
  socket.on("welcome", (data) => {
    console.log(data)
  })

  //user hits login button
  this.loginRequest = function (user, pass) {
    socket.emit('loginRequest', {
      username: user,
      password: pass
    })

  }
  //this is the result of the login request     
  socket.on('loginResult', (bool, user) => {
    if (bool) {
      view.UpdateHeader("Success!");
      view.hideLogin();
      this.username = user;
    }
    else {
      view.UpdateHeader("Wrong username or password...")
    }

  })

  //user hits signup button
  this.signupRequest = function (user, pass) {
    socket.emit('signupRequest', {
      username: user,
      password: pass
    })
  }
  //did the user succeed in signing up?
  socket.on("signupResult", (bool) => {
    if (bool) {
      view.UpdateHeader("Signup Successful! \nPlease log in with your new credentials.")
    }
    else {

      view.UpdateHeader("Oops! Looks like someone has that username!")

    }
  })


  socket.on("updateLobby", (activePlayers) => {
    console.log(activePlayers)
    view.updateLobbyPlayers(activePlayers)

  })

  //sending and recieving a challenge
  this.challengePlayer = function (targetUser, reqUser) {
    socket.emit("challengeAnotherPlayer", targetUser, reqUser)
  }
  socket.on('incomingChallenge',(otherUsername)=>{
    view.challengeNotification(otherUsername)

  })

}
//functions to update the view
function ViewHandlers() {
  var activeUsersElem = $("#users-online .user-div:first").clone();
  var mainHeader = $("h1:first")
  var loginForm = $("#login-form").clone()

  this.UpdateHeader = function (html) {
    $(mainHeader).html(html)
  }
  //refreshes the list of active players
  this.updateLobbyPlayers = function (usersArr) {
    $("#users-online").empty();
    for (var userStrg in usersArr) {
      let newUser = $(activeUsersElem).clone()
      $(newUser).find("p").html(usersArr[userStrg]);
      $("#users-online").append(newUser);
    }
  }

  this.hideLogin = function () {
    $("#right-col").animate({ maxWidth: "0%", opacity: 0, paddingRight: "-100px" }, 300, () => {
      $("#right-col").empty();

    })
    $("#center-col").css({ maxWidth: "50%" })
  }

  this.challengeNotification = function(incomingUsername){
    $("#incoming-challenge p").html(incomingUsername + " challenged you! Do you accept?")
    $("#incoming-challenge").removeAttr("hidden")

  }
  
  
}

function LoginHandlers() {
  this.username = () => $("#username").val();
  this.password = () => $("#password").val();
  
  this.onLogin = function (cliRoutes, username, pass) {
    cliRoutes.loginRequest(username, pass)
    
  }
  
  this.onSignUp = function (cliRoutes, username, pass) {
    cliRoutes.signupRequest(username, pass)
  }
  
  
  
}

function Lobby() {
  this.targetPlayer = undefined;
  this.challengeTargetPlayer = function (routes, callingUser) {
    if (this.targetPlayer != undefined) {
      routes.challengePlayer(this.targetPlayer,callingUser)
    }
  }
  
}



function Client() {
  var loginForm = new LoginHandlers();
  var clientRoutes = new ClientRoutes();
  var lobby = new Lobby();
  var getUsername = () => clientRoutes.username
  $("#login-btn").on('click', (e) => {
    loginForm.onLogin(clientRoutes, loginForm.username(), loginForm.password());
  })
  
  $("#signup-btn").on('click', (e) => {
    loginForm.onSignUp(clientRoutes, loginForm.username(), loginForm.password())
  })
  
  $("#users-online").on("click", ".user-div", (e) => {
    $("#users-online .user-div").removeClass("selected");
    $(e.currentTarget).addClass("selected");
    var targetUser = $(e.currentTarget).find("p").html();
    lobby.targetPlayer = targetUser;
    $("#play-btn").removeAttr("disabled");
    
  })
  
  $("#play-btn").on('click', function () {
    lobby.challengeTargetPlayer(clientRoutes, getUsername());
    
  })
  
  
}

$(document).ready(function () {
  Client();
})