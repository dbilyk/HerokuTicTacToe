function ClientRoutes() {
  const view = new ViewHandlers(this)
  this.username = ""
  var waitingInterval;
  this.getSocket = () => socket
  var socket = io();

  var newGame = ClientGameEvents(socket, view)

  //when we successfully connect to our node socket server
  socket.on("welcome", (data) => {

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
      view.updateLogin("Success!",true);
      view.hideLogin();
      this.username = user;
      view.updateMyUsername(user)
    }
    else {
      view.updateLogin("Wrong username or password...",false)
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
      view.updateLogin("Signup Successful! \nPlease log in with your new credentials.",true)
    }
    else {

      view.updateLogin("Oops! Looks like someone has that username!",false)

    }
  })
  //request lobby update
  this.updateLobby = function () {
    socket.emit("updateLobby");
  }

  //recieving lobby update
  socket.on("updateLobby", (activePlayersData) => {
    view.updateLobbyPlayers(activePlayersData)
    console.log(activePlayersData)

  })
  //send challenge
  this.challengePlayer = function (targetUser, reqUser) {
    socket.emit("newChallenge", targetUser, reqUser)
    this.waitingInterval = view.waitForChalResponse()
    view.updateOpponentusername(targetUser)
  }
  //recieve challenge
  socket.on('newChallenge', (otherUsername) => {
    view.newChallengeNotification(otherUsername)

  })
  //send challenge response
  this.challengeResponse = function (answer, targetBtn, myUsername) {
    socket.emit("challengeResponse", answer, this.username)
    if (answer) view.enterGame()

    view.deleteChalNotification(targetBtn)

  }

  //recieve challenge response
  socket.on("challengeResponse", (answer,otherUser) => {
    (answer) ? view.enterGame() : view.declineChallenge(waitingInterval)
    view.updateOpponentusername(otherUser)
  })

  //send cancel challenge
  this.cancelChallenge = function () {
    socket.emit("cancelChallenge")
    view.declineChallenge(waitingInterval)
  }
  //recieve cancel challenge
  socket.on("cancelChallenge", (username) => {
    view.deleteChalNotification(username)
  })

  socket.on("error", () => {
    view.error()
  })
}
//functions to update the view
function ViewHandlers(routes) {
  var clientRoutes = routes
  var activeUsersElem = $("#users-online .user-div").clone();
  $("#users-online .user-div:first").remove()
  var mainHeader = $("h1:first")
  var loginForm = $("#login-form").clone()
  var challengeAlertTemplate = $(".incoming-challenge:first").clone()
  var awaitingResponse = false
  var enteredGame = false
  var activeChallenges = []

  this.error = function () {
    this.updateHeader("oops, something went wrong!")
    $("#gameboard").hide()
    $("#opponent-name").hide('fast').css({ maxWidth: "50%", marginLeft: "0.5em" })
    $("#users-online").show("fast")
    $(".user-div").show()
    $("#left-col").css('opacity', '1')
    $("#play-btn").show("fast")
    $("#gameboard").removeClass('colorClass').css({ opacity: 1, height: 'auto' })
  }

  var challengeNotification = function (username, notification) {
    this.username = username;
    this.notification = notification;
  }

  this.updateHeader = function (html) {
    $(mainHeader).html(html)
  }
  this.updateLogin = function(html,ok){
    if(ok){
      $("#login-error").html(html);
      $("#login-error").css({backgroundColor: 'lightgreen'})
    }
    else{
      $("#login-error").html(html);
      $("#login-error").css({backgroundColor: ''})
      
    }
  }

  this.updateMyUsername = function (username) {
    $("#my-name h3").html(username)
    $("#my-name").show()
    $("#center-col>div.row:last-child").show()
  }

  this.updateOpponentusername = function (username) {
    $("#opponent-name h3").html(username)
  }
  //refreshes the list of active players
  this.updateLobbyPlayers = function (usersArr) {
    if (!awaitingResponse) {
      $("#users-online .user-div").remove()
      for (var i = 0; i< usersArr.length; i++) {
        let newUser = activeUsersElem.clone()
        newUser.find(".username").html(usersArr[i].username);
        newUser.find(".wins").html("wins: " +usersArr[i].wins +" / ")
        newUser.find(".losses").html(usersArr[i].losses + ":losses")
        newUser.addClass("user-list-" + usersArr[i].username);
        $("#users-online").append(newUser);

      }
    }
  }
  this.bounce = ($object, rate, spread) => {
    var r = (rate) ? rate : 75
    var s = (spread) ? spread : 5
    $object.prop("height", $object.outerHeight() + "px")
    $object.animate({ height: "+=" + s + "px" }, r, () => {
      $object.animate({ height: "-=" + s + "px" }, r)
      
    })
    setTimeout(() => {
      $object.animate({ width: "+=" + s + "px" }, r, () => {
        $object.animate({ width: "-=" + s + "px" }, r,()=>{
        $object.css({width:"",height:''})
      })
      })

    })
  }
  this.hideLogin = function () {
    $("#login-form").animate({opacity: 0, paddingRight: "-100px" }, 200, () => {

      $("#right-col").empty();
      this.bounce($("#users-online"))

    })

  }


  this.newChallengeNotification = function (incomingUsername) {
    var notif = $(challengeAlertTemplate).clone()
    $(notif).addClass("notification-from-" + incomingUsername)
    $(notif).find("p").html('<strong>'+incomingUsername + "</strong> challenged you!<br> Do you accept?")
    $('#opponent-name h3').html(incomingUsername)
    $("#left-col").append(notif)
    $(notif).show("fast")
    activeChallenges.push(incomingUsername, $(notif))
  }

  this.waitForChalResponse = function () {
    $(".user-div").hide();
    $("#play-btn").hide();
    awaitingResponse = true;
    var content = ["Waiting for response<br>", ".", "..", "..."];
    var count = 1
    $("#waiting, #cancel-req-btn").show()
    var updateWait = (index) => {
      $("#waiting").html(content[0] + content[index])
    }
    var waiting = setInterval(() => {
      if (count == 1) {
        updateWait(1)
        count++;
      }
      else if (count == 2) {
        updateWait(2)
        count++
      }
      else {
        updateWait(3)
        count = 1;
      }
    }, 500)
    return waiting
  }
  //when challenge is accepted by opponent
  this.enterGame = function () {
    this.updateHeader("entered game")
    $("#users-online").hide()
    $("#play-btn").hide()
    $("#opponent-name").show()
    $("#gameboard").show()
    $("#waiting, #cancel-req-btn").hide()
    this.bounce($("#gameboard"), 300)

  }
  //when challenge is declined by opponent
  this.declineChallenge = function (waitingTimer) {
    clearInterval(waitingTimer)
    this.updateHeader("challenge declined")
    $(".user-div").show()
    $("#play-btn").show()
    $("#waiting, #cancel-req-btn").hide('fast')
    awaitingResponse = false
    clientRoutes.updateLobby()

  }


  //deletes the notification that a user responded to
  this.deleteChalNotification = function (targetBtn) {
    if (typeof targetBtn == "object") {
      $(targetBtn).parent().remove()
    }
    else {
      $(".notification-from-" + targetBtn).remove()
    }
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
      routes.challengePlayer(this.targetPlayer, callingUser)
    }
  }

  this.challengeResponse = function (cliRoutes, accepted, targetBtn) {
    cliRoutes.challengeResponse((accepted) ? true : false, targetBtn)
    console.log("response made it to lobby")
  }

  this.cancelChallenge = function (cliRoutes) {
    cliRoutes.cancelChallenge()
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
    var targetUser = $(e.currentTarget).find(".username").html();
    lobby.targetPlayer = targetUser;
    //you cant play with yourself :)
    if (targetUser != getUsername()) {
      $("#play-btn").removeAttr("disabled");
    }
    else {
      $("#play-btn").prop("disabled", true);
    }
  })

  $("#play-btn").on('click', function () {

    lobby.challengeTargetPlayer(clientRoutes, getUsername());

  })

  $("#left-col").on("click", ".accept-chal", (e) => {
    lobby.challengeResponse(clientRoutes, true, e.target)
  })

  $("#left-col").on('click', ".decline-chal", (e) => {
    lobby.challengeResponse(clientRoutes, false, e.target)

  })

  $("#cancel-req-btn").on('click', (e) => {
    lobby.cancelChallenge(clientRoutes)
  })




}

$(document).ready(function () {

  $("canvas").prop("width", $("canvas:first-of-type").outerWidth())
  $("canvas").prop("height", $("canvas:first-of-type").outerHeight())
  $("canvas").prop("checked", false)

  $(".incoming-challenge, #waiting, #cancel-req-btn,#my-name,#center-col>div.row:last-child,#opponent-name, #gameboard").hide()
  Client();
})