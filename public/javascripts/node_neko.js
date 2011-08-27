$(function(){
  "use strict";
  var socket = io.connect();
  var MAX_TICK = 0xffffffff;
  var maxcounter = 0xffffffff;
  var imagePath = "./images/";
  var NekoColorList = ["black","gray","tora","white","yellow"];
  function Neko() { }
  Neko.prototype.x = null;
  Neko.prototype.y = null;
  Neko.prototype.moveDx = null;
  Neko.prototype.moveDy = null;
  Neko.prototype.state = null;
  Neko.prototype.lastx = null;
  Neko.prototype.lasty = null;
  Neko.prototype.tickCount = 0;
  Neko.prototype.stateCount = 0;
  Neko.prototype.color = null;
  

  function Mouse() { }
  Mouse.prototype.x = null;
  Mouse.prototype.y = null;
  Mouse.prototype.prevX = null;
  Mouse.prototype.prevY = null;
  var animationTable = [
    "mati1",    //0
    "jare2",    //1
    "kaki1",    //2
    "kaki2",    //3
    "mati2",    //4
    "sleep1",   //5
    "sleep2",   //6
    "awake",    //7
    "up1",      //8
    "up2",      //9
    "down1",    //10
    "down2",    //11
    "left1",    //12
    "left2",    //13
    "right1",   //14
    "right2",   //15
    "upleft1",  //16
    "upleft2",  //17
    "upright1", //18
    "upright2", //19
    "dwleft1",  //20
    "dwleft2",  //21
    "dwright1", //22
    "dwright2"  //23
  ];

  var ontheWall = function(neko_obj) {
//    console.log("ontheWall invoked");
    return true;
  };

  var notice = function (neko_obj) {
//    console.log("notice invoked");
    nekoDirection(neko_obj);
    return true;
  };

  var running = function(neko_obj) {
//    console.log("running invoked");
    nekoDirection(neko_obj);
    if (isWindowOver(myMouse)) {
      if (isNekoDontMove(neko_obj)) {
	setNekoState(neko_obj,"NEKO_STOP");
	return false;
      }
    }
    neko_obj.x = parseInt(neko_obj.x + neko_obj.moveDx);
    neko_obj.y = parseInt(neko_obj.y + neko_obj.moveDy);
    return true;
  };
  
  var statusTable = {
    "NEKO_STOP": ["NEKO_JARE", 4, "NEKO_AWAKE", ontheWall, 1, [0, 0]],
    "NEKO_AWAKE": ["NEKO_AWAKE", 3, "NO_STATE", notice, 1, [7, 7]],
    "NEKO_U_MOVE": ["NO_STATE", "NO_TIME", "NO_STATE", running, 1, [8, 9]],
    "NEKO_D_MOVE": ["NO_STATE", "NO_TIME", "NO_STATE", running, 1, [10, 11]],
    "NEKO_L_MOVE": ["NO_STATE", "NO_TIME", "NO_STATE", running, 1, [12, 13]],
    "NEKO_R_MOVE": ["NO_STATE", "NO_TIME", "NO_STATE", running, 1, [14, 15]],
    "NEKO_UL_MOVE": ["NO_STATE", "NO_TIME", "NO_STATE", running, 1, [16, 17]],
    "NEKO_UR_MOVE": ["NO_STATE", "NO_TIME", "NO_STATE", running, 1, [18, 19]],
    "NEKO_DL_MOVE": ["NO_STATE", "NO_TIME", "NO_STATE", running, 1, [20, 21]],
    "NEKO_DR_MOVE": ["NO_STATE", "NO_TIME", "NO_STATE", running, 1, [22, 23]],
    "NEKO_JARE": ["NEKO_KAKI", 10, "NEKO_AWAKE", "NO_FUNC", 1, [1, 0]],
    "NEKO_KAKI": ["NEKO_AKUBI", 4, "NEKO_AWAKE", "NO_FUNC", 1, [2, 3]],
    "NEKO_AKUBI": ["NEKO_SLEEP", 3, "NEKO_AWAKE", "NO_FUNC", 2, [4, 4]],
    "NEKO_SLEEP": ["NO_STATE", 100, "NEKO_AWAKE", "NO_FUNC", 4, [5, 6]]
  };

  
  $("#play").mouseover(function(e){
    if(e.pageX) {
      myMouse.prevX = myMouse.x;
      myMouse.x = e.pageX;
    }
    if(e.pageY){
      myMouse.prevY = myMouse.y;
      myMouse.y = e.pageY;
    }
  });
  $("#play").mousemove(function(e){
    if(e.pageX) {
      myMouse.prevX = myMouse.x;
      myMouse.x = e.pageX;
    }
    if(e.pageY){
      myMouse.prevY = myMouse.y;
      myMouse.y = e.pageY;
    }
  });
  $("#play").mouseout(function(e){
    myMouse.prevY = myMouse.y;
    myMouse.prevY = myMouse.y;
    myMouse.x = null;
    myMouse.y = null;
    myNeko.moveDx = 0;
    myNeko.moveDy = 0;
  });

  function isWindowOver(mouse_obj) {
    if(mouse_obj.x === null || mouse_obj.y === null) {
      return true;
    } else {
      return false;
    }
  }

  function isNekoDontMove(neko_obj) {
    if (neko_obj.x === neko_obj.lastx && neko_obj.y === neko_obj.lasty) {
      return true;
    } else {
      return false;
    }
  }
  

  function isNekoMoveStart(mouse_obj)
  {
    var idleSpace = 2;
    if(mouse_obj.prevX === null || mouse_obj.x === null || mouse_obj.prevY === null || mouse_obj.y === null) {
      return false;
    }
    
    if ((mouse_obj.prevX - idleSpace <= mouse_obj.x && mouse_obj.x <= mouse_obj.prevX + idleSpace) &&
        (mouse_obj.prevY - idleSpace <= mouse_obj.y && mouse_obj.y <= mouse_obj.prevY + idleSpace)) {
      return false;
    } else {
      return true;
    }
  }
  
  function nekoDirection(neko_obj) {
    var new_state = null;

    if (neko_obj.moveDx === 0 && neko_obj.moveDy === 0) {
      new_state = "NEKO_STOP";
    } else {
      if (neko_obj.moveDx > 0) {
	if (neko_obj.moveDy > 0) {
          if (neko_obj.moveDx*2 < neko_obj.moveDy) {
	    new_state = "NEKO_D_MOVE";
          } else if (neko_obj.moveDy*2 < neko_obj.moveDx) {
	    new_state = "NEKO_R_MOVE";
          } else {
	    new_state = "NEKO_DR_MOVE";
          }
	} else {
          if (neko_obj.moveDx*2 < -neko_obj.moveDy) {
	    new_state = "NEKO_U_MOVE";
          } else if (-neko_obj.moveDy*2 < neko_obj.moveDx) {
	    new_state = "NEKO_R_MOVE";
          } else {
	    new_state = "NEKO_UR_MOVE";
          }
	}
      } else {
	if (neko_obj.moveDy > 0) {
          if (-neko_obj.moveDx*2 < neko_obj.moveDy) {
	    new_state = "NEKO_D_MOVE";
          } else if (neko_obj.moveDy*2 < -neko_obj.moveDx) {
	    new_state = "NEKO_L_MOVE";
          } else {
	    new_state = "NEKO_DL_MOVE";
          }
	} else {
          if (-neko_obj.moveDx*2 < -neko_obj.moveDy) {
	    new_state = "NEKO_U_MOVE";
          } else if (-neko_obj.moveDy*2 < -neko_obj.moveDx) {
	    new_state = "NEKO_L_MOVE";
          } else {
	    new_state = "NEKO_UL_MOVE";
          }
	}
      }
    }
    if (new_state && neko_obj.state !== new_state ) {
      setNekoState(neko_obj,new_state);
    }
  }
  
  var nekoSpeed = 10;

  function calcDxDy(neko_obj) {
    var dx,dy;
    var length;
    if(myMouse.x === null || myMouse.y === null) {
      return;
    }
    dx = myMouse.x - neko_obj.x;
    dy = myMouse.y - neko_obj.y;
    length = Math.sqrt(dx*dx+dy*dy);
    if( (dx || dy) && (  length > nekoSpeed)) {
      dx = (nekoSpeed/length)*dx;
      dy = (nekoSpeed/length)*dy;
      neko_obj.moveDx = dx;
      neko_obj.moveDy = dy;
    } else {
      neko_obj.moveDx = 0;
      neko_obj.moveDy = 0;
    }
  }
  function drawNeko(neko_obj) {
    var animation_img = getAnimation(neko_obj);
    $("#myneko").empty();
    $("#myneko").html('<div class="'+neko_obj.color+' '+animation_img+'" id="'+screen_name+'"></div><div>'+screen_name+'</div>');
    $("#myneko").css("left",neko_obj.x+"px");
    $("#myneko").css("top", neko_obj.y+"px");
    
    neko_obj.lastx = neko_obj.x;
    neko_obj.lasty = neko_obj.y;
  }

  function drawOtherNeko(neko_obj) {
    var animation_img = getAnimation(neko_obj);
    var other_screen_name = neko_obj.screen_name;
    if(!($("div").is("#"+other_screen_name))){
      $("#play").append('<div id="'+other_screen_name+'" class="nekoarea"></div>');
    }
    var other = $("#"+other_screen_name);
    other.empty();
    other.html('<div class="'+neko_obj.color+' '+animation_img+'" id="'+neko_obj.screen_name+'"></div><div>'+neko_obj.screen_name+'</div>');
    other.css("left",neko_obj.x+"px");
    other.css("top", neko_obj.y+"px");
  }
  
  function tickCount(neko_obj) {
    if (++neko_obj.tickCount >= MAX_TICK) {
      neko_obj.tickCount = 0;
    }
    if (neko_obj.tickCount % 2 == 0) {
      if (neko_obj.stateCount < MAX_TICK) {
	neko_obj.stateCount++;
      }
    }	
  }

  function getAnimation(neko_obj) {
    var animationIndex = (statusTable[neko_obj.state])[5];
    var frameTicks = (statusTable[neko_obj.state])[4];
    var index = (neko_obj.tickCount/frameTicks) & 0x1;
    return animationTable[animationIndex[index]];
  }

  function nekoThinkDraw(neko_obj) {
    calcDxDy(neko_obj);


    drawNeko(neko_obj);

    tickCount(neko_obj);

    var state_when_moved = (statusTable[neko_obj.state])[2];

    if (state_when_moved !== "NO_STATE") {
      if (isNekoMoveStart(myMouse)) {
	setNekoState(neko_obj,state_when_moved);
	return("state_when_moved");
      }
    }
    

    var repeat_count = (statusTable[neko_obj.state])[1];
    var flame_ticks = (statusTable[neko_obj.state])[4];
    if (repeat_count !== "NO_TIME") {
      if (neko_obj.stateCount < repeat_count*flame_ticks) {
	return("repat_count");
      }
    }
    var action = (statusTable[neko_obj.state])[3];
    if (action !== "NO_FUNC") {
      if (action(neko_obj) === false) {
	return("func");
      }
    }
    var next_state = (statusTable[neko_obj.state])[0];
    if (next_state !== "NO_STATE") {
      setNekoState(neko_obj,next_state);
    }
    return("final");
  }

  var nekoTickCount,nekoStateCount,nekoState;
  function setNekoState(neko_obj,setValue) {
    neko_obj.tickCount = 0;
    neko_obj.stateCount = 0;
    neko_obj.state = setValue;
  }

  // main routine
  var screen_name = $("#screen_name").html();
  var myMouse = new Mouse();
  if(screen_name){
    var myNeko = new Neko();
    myNeko.color = NekoColorList[parseInt(Math.random()*NekoColorList.length)];
    myNeko.screen_name = screen_name;
    var counter = 0;
    setNekoState(myNeko, "NEKO_STOP");
    myNeko.lastx = parseInt($("#myneko").css("left"));
    myNeko.lasty = parseInt($("#myneko").css("top"));
    myNeko.x = parseInt($("#myneko").css("left"));
    myNeko.y = parseInt($("#myneko").css("top"));
    var tmout = setInterval(function(){
      var a = nekoThinkDraw(myNeko);
      var sendJson = {"nekoData": myNeko};
      socket.json.send(sendJson);
      if( counter > maxcounter ){
        clearInterval(tmout);
        console.log("Finished");
      }
      counter++;
    }, 1000/10);
  }
  socket.on('connect', function(){
    socket.on('message',function(msg){
//      console.log(JSON.stringify(msg));
      if("nekoData" in msg ) {
        var nekoObj = msg["nekoData"];
        drawOtherNeko(nekoObj);
      }
    });
  });
});