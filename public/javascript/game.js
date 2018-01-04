function GameRoutes(io, lobView) {
  var socket = io
  var lobbyView = lobView
  var view = new GameView()
  var myTurn = false
  var animSpeed = 1.5
  var roomID



  //user send input
  this.userInput = function (canvas) {
    if (view.getState() == null && !$(canvas).prop("checked") && myTurn) {
      let id = $(canvas)[0].id
      var position = id.match(/\d/)[0]
      socket.emit("playTurn", { roomID: roomID, position: position })
      $(canvas).prop("checked", true)
      view.animate("X", canvas, animSpeed)
      $("#opponent-name").addClass("turn-border")
      $("#my-name").removeClass("turn-border")
      myTurn = false;
    }

  }


  socket.on("gameSetup", (object) => {
    //choose who gets to go first
    myTurn = object.opponentStatus.myTurn
    roomID = object.roomID
    view.setup()
    if (myTurn) {
      $("#my-name").addClass("turn-border")
    }
    else{

      $("#opponent-name").addClass("turn-border")
    }
  })

  //recieve a turn
  socket.on("playTurn", (pos) => {
    $($("canvas")[pos]).prop("checked", true)
    view.animate('O', $("canvas")[pos], animSpeed)
    myTurn = true;

    $("#my-name").addClass("turn-border")
    $("#opponent-name").removeClass("turn-border")
  })
  //server confirmed win!
  socket.on("youWon", (winningPos) => {
    view.animate("X", $("canvas")[winningPos], animSpeed)
    lobbyView.updateHeader("you WON!")
    view.exitGame(true)
  })
  //server confirmed loss...
  socket.on("youLost", (winningPos) => {
    lobbyView.updateHeader("you LOST!")
    view.animate("O", $("canvas")[winningPos], animSpeed)
    view.exitGame(false)
  })

  socket.on("draw", () => {
    lobbyView.updateHeader("draw...")
    view.exitGame()
  })


}

function GameView() {
  var animStart
  var currentAnimFrame = null
  var firstLineSaved = false
  this.getState = () => currentAnimFrame;
  this.animate = function (isX, canvas, speed) {
    animStart = Date.now()

    var requestAnimationFrame =
      window.requestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.msRequestAnimationFrame;

    //if were not animating
    if (currentAnimFrame == null) {
      //drawing X or O?
      if (isX.toLowerCase() == "x")
        currentAnimFrame = requestAnimationFrame(() => this.drawX(canvas, speed))
      else
        currentAnimFrame = requestAnimationFrame(() => this.drawO(canvas, speed))
    }
  }
  this.setup = function () {
    $("canvas").prop("checked", false)
    $("#my-name, #opponent-name").removeClass("turn-border")
    for (var i = 0; i < 9; i++) {
      var canvas = $("canvas")[i]
      let ctx = canvas.getContext("2d")
      ctx.clearRect(0, 0, $("canvas").outerWidth(), $("canvas").outerHeight())
      $("#left-col").css("opacity", "0")
    }
  }

  this.drawX = function (canvas, speed) {
    var cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;
    var time = (new Date().getTime() - animStart) * 0.002 * speed;

    var width = (canvas.width)
    var height = (canvas.height)
    var ctx = canvas.getContext('2d')
    var pad = 20
    ctx.lineWidth = 8 * time
    ctx.lineCap = "round"
    ctx.strokeStyle = "#62db5c"
    //drawing first line
    if (width - pad > (width - pad) * time && !firstLineSaved) {
      ctx.beginPath()
      ctx.moveTo(0 + pad, 0 + pad)
      ctx.lineTo((width - pad) * time, (height - pad) * time)
      ctx.stroke()
      ctx.closePath()
      currentAnimFrame = requestAnimationFrame(() => this.drawX(canvas, speed))
    }
    //drawing second line AFTER the first line
    else {
      if (!firstLineSaved) {
        firstLineSaved = true;
        animStart = Date.now()
        time = (new Date().getTime() - animStart) * 0.002 * speed;
        ctx.save()
      }
      if (0 + pad < (width - pad) - ((width - pad) * time)) {
        ctx.restore()
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(width - pad, pad)
        ctx.lineTo((width - pad) - ((width - pad) * time), (height - pad) * time + pad)
        ctx.stroke()

        currentAnimFrame = requestAnimationFrame(() => this.drawX(canvas, speed))

      }
      //done drawing stuff
      else {
        currentAnimFrame = null;
        firstLineSaved = false;
      }
    }


  }
  this.drawO = function (canvas, speed) {
    var cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;
    var time = (new Date().getTime() - animStart) * 0.002 * speed;
    var ctx = canvas.getContext("2d")
    ctx.strokeStyle = "#db685c"
    ctx.lineWidth = 8 * time
    ctx.moveTo(canvas.width, canvas.height / 2)
    ctx.beginPath()
    ctx.arc(canvas.width / 2, canvas.height / 2, ((canvas.width / 2) + (canvas.height / 2)) / 3, 0 * Math.PI, 2 * Math.PI * time)
    ctx.stroke()
    if (2 * time < 2) {
      currentAnimFrame = requestAnimationFrame(() => this.drawO(canvas, speed))

    }
    else {
      currentAnimFrame = null
    }

  }

  function exit(colorClass) {
    $("#gameboard").addClass(colorClass);
    $("#opponent-name").hide()
    $("my-name").removeClass("turn-border")
    $("#my-name").animate({ minWidth: "100%" }, 500, () => {
      $("#my-name").css("minWidth", "")
    })
    $("#gameboard").animate({ backgroundColor: "white", opacity: 0, height: "0px" }, 2000, () => {
      $("#gameboard").hide()

      $("#users-online").show("fast")
      $(".user-div").show()
      $("#left-col").css('opacity', '1')
      $("#play-btn").show("fast")
      $("#gameboard").removeClass(colorClass).css({ opacity: 1, height: 'auto' })

    })
  }
  this.exitGame = function (wonBool) {
    if (wonBool && arguments.length > 0) {
      exit("winColor")
    }
    else if (!wonBool && arguments.length > 0) {
      exit("loseColor")
    }
    else {
      exit("drawColor")
    }
  }



}

function ClientGameEvents(io, lobbyView) {

  var gameRoutes = new GameRoutes(io, lobbyView);
  $("#gameboard").on('click', "canvas", (e) => {
    var canvas = $(e.target)[0];
    gameRoutes.userInput(canvas)
  })
}

