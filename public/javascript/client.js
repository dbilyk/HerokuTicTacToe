function ClientRoutes(){
  const view = new ViewHandlers()
  var socket = io.connect("192.168.50.236:3000");
  //when we successfully connect to our node socket server
  socket.on("welcome",(data)=>{
    console.log(data)
  })
  
  //user hits login button
  this.loginRequest = function(user,pass){
    socket.emit('loginRequest',{
      username: user,
      password: pass
    })

  }
  //this is the result of the login request     
  socket.on('loginResult',(bool)=>{
    console.log(bool);
    if(bool){
      $("h1:first").html("Success!")

    }
    else{
      $("h1:first").html("Wrong username or password...")
    }

  })
  
  //user hits signup button
  this.signupRequest = function(user,pass){
    socket.emit('signupRequest',{
      username:user,
      password:pass
    })
  }
  //did the user succeed in signing up?
  socket.on("signupResult",(bool)=>{
    if(bool){
      $("h1:first").html("Signup Successful! \nPlease log in with your new credentials.")
    }
    else{

      $("h1:first").html("Oops! Looks like someone has that username!")

    }
  })


  socket.on("updateLobby",(data)=>{
    view.updateLobbyPlayers(data.username,data.state)
    
  })


}

function ViewHandlers(){
  var activeUsersElem = () => $("#users-online .user-div:first").clone();

  this.updateLobbyPlayers = function(user,state){
    if(state){
      
      let newUser = $(activeUsersElem()).clone()
      $(newUser).find("p").html(user);
      $("#users-online").append(newUser);
    }
    else{
      $("#users-online").find("."+ user).hide();
      
    }
  }


}

function LoginHandlers(){
  this.username = () => $("#username").val();
  this.password = () => $("#password").val();
  
  this.onLogin = function(cliRoutes,username,pass){
    cliRoutes.loginRequest(username,pass)

  }
  
  this.onSignUp = function(cliRoutes,username,pass){
    cliRoutes.signupRequest(username,pass)
  }
  
}

function Client(){
  var loginForm = new LoginHandlers();
  var clientRoutes = new ClientRoutes();
  $("#login-btn").on('click',(e)=>{
    loginForm.onLogin(clientRoutes,loginForm.username(),loginForm.password());  
  })
  
  $("#signup-btn").on('click',(e)=>{
    loginForm.onSignUp(clientRoutes,loginForm.username(),loginForm.password())
  })
}

$(document).ready(function(){
Client();
})