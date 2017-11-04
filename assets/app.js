
var config = {
    apiKey: "AIzaSyAuVD70_hguXaDaQm5vMfYPCXBKGT-IGeM",
    authDomain: "rpsgame-85e15.firebaseapp.com",
    databaseURL: "https://rpsgame-85e15.firebaseio.com",
    projectId: "rpsgame-85e15",
    storageBucket: "",
    messagingSenderId: "702216563760"
 };

    firebase.initializeApp(config);

var database = firebase.database();
var player1 = {
	name:"TBD"
};
var player2 = {
	name:"TBD"
};
var gameStarted = false;
var you;
var gameStatus;
var i = 0;
var winner;

//listen for changes in gameStatus
database.ref('gameStatus/').on("value", function(dbStatus) {
	//console.log('DB Status ' + dbStatus.val());


	if(dbStatus.val() == 'Play'){
		//determine winner 
		winner = getWinner(player1.currentPick + player2.currentPick);
		//show winner on screen
		showWinner();
		//show results, prepare next round
		setTimeout(startNextRound, 3000);
	}
})

//listen for changes to p1, set to local object each time
database.ref('player1/').on("value", function(snapshot) {
	player1 = snapshot.val();
	//see if game status changes (for log in or guess)
	gameStatus = getGameStatus();
	//update both players' screen
	updateOnScreen();
	//update just my screen
	localUpdateOnScreen();
})

database.ref('player2/').on("value", function(snapshot) {
	player2 = snapshot.val();
	gameStatus = getGameStatus();
	updateOnScreen();
	localUpdateOnScreen();
})

//set database boolean if a user 'disconnects', which includes refreshes
database.ref().onDisconnect().update(
		{reset:true}
	)
//if there is a disconnect, reset everything. Not ideal but it keeps things playable. 
database.ref('reset/').on("value",function(serverReset){
	if(serverReset.val() == true){
		//show message that game is resetting
		resetMessage();
	}
});

//reset player 1 on disconnect. I think the way we are using Firebase...I had a hard time determining
//WHICH player disconnected.  Both of the disconnect listeners below run no matter who disconnects. 
database.ref('player1/').onDisconnect().update(
 			{	
				wins: 0,
				losses: 0,
				currentPick:'none',
				name:'TBD'
			})

database.ref('player2/').onDisconnect().update(
 			{	
				wins: 0,
				losses: 0,
				currentPick:'none',
				name:"TBD"
			}
		)


var getGameStatus = function(){
	var newStatus;
	if(player1.name == 'TBD' && player2.name == 'TBD'){
		newStatus = 'Not Started';

	}

	else if(player1.name == 'TBD' || player2.name == 'TBD'){
		newStatus = 'Need 1 Player';
	}

	else if (player1.currentPick == 'none' && player2.currentPick == 'none') {
		newStatus = 'Need 2 Selections';
		
	}
	else if(player1.currentPick !== 'none' && player2.currentPick !== 'none'){
		newStatus = 'Play';
	}
	else if (player1.currentPick !== 'none' || player2.currentPick !== 'none'){
		newStatus = 'Need 1 Selection'
	}
	else {
		newStatus = 'Not Started'
	}
	
	//if status has changed, send to server
	if(gameStatus !== newStatus){
		database.ref().update({gameStatus:newStatus});
	}

	return newStatus;
}

//I don't know why I did this this way (with a string).  LOL why not, made the logic look simple?
var getWinner = function(pickString){
	var winner;
	console.log(pickString);
	switch (pickString) {
    case 'rockrock':  winner = "Tie"; break;
    case 'rockpaper':  winner = "player2"; break;
    case 'rockscissors':  winner = "player1"; break;

    case 'scissorsscissors':  winner = "Tie"; break;
    case 'scissorspaper':  winner = "player1"; break;
    case 'scissorsrock':  winner = "player2"; break;

    case 'paperpaper':  winner = "Tie"; break;
    case 'paperrock':  winner = "player1"; break;
    case 'paperscissors':  winner = "player2"; break;
	}
    return winner;
}


//show winner on screen, calculate new W/L totals
var showWinner = function(){
	$("#p1-currentPick").text(player1.currentPick);
	$("#p2-currentPick").text(player2.currentPick);
	$(".choices").addClass('hidden');


	if(winner == "player1"){
		$("#message").text(player1.name + " wins!");
		player1.wins++;
		player2.losses++;
	}
	else if (winner == "player2"){
		$("#message").text(player2.name + " wins!");
		player2.wins++;
		player1.losses++;
	}
	else {
		$("#message").text("TIE!");
	}
}

//reset things next round, show new W/L totals
var startNextRound = function(){
	$("#message").empty();
	$("#p1-currentPick").empty();
	$("#p2-currentPick").empty();
	$(".choices").removeClass("hidden");
	database.ref('player1/').update({wins:player1.wins});
	database.ref('player2/').update({wins:player2.wins});
	database.ref('player1/').update({currentPick:'none'});
	database.ref('player2/').update({currentPick:'none'});
}


var updateOnScreen = function(){
	if(gameStatus == 'Not Started'){

	}
	else if(gameStatus == 'Need 1 Player'){
	
		if(player1.name !== "TBD"){
			$("#player-1-start").addClass("hidden");
			$("#p1-form").addClass("hidden");	
			$("#player-1-title").text("Player 1: " + player1.name);
		}
		else {
			$("#player-2-start").addClass("hidden");
			$("#p2-form").addClass("hidden");	
			$("#player-2-title").text("Player 2: " + player2.name);
		}
		
		
	}
	else if(gameStatus == 'Need 2 Selections'){
		$("#p1-form").addClass("hidden");	
		$("#player-1-title").text("Player 1: " + player1.name + "  W:" + player1.wins + "  L:" + player1.losses);
		$("#player-2-start").addClass("hidden");
		$("#p2-form").addClass("hidden");	
		$("#player-2-title").text("Player 2: " + player2.name + "  W:" + player2.wins + "  L:" + player2.losses);
	}
}


var localUpdateOnScreen = function(){
	if(gameStatus == 'Need 2 Selections' && you == 'player1'){
		$("#choices1").removeClass("hidden");
	}
	else if(gameStatus == 'Need 2 Selections'){
		$("#choices2").removeClass("hidden");
	}
}

//show reset message for 4 seconds, then move to actual reset function. Clear chat. 
var resetMessage = function(){
	var message = 'One player has left....resetting last game';
	$("#message").text(message);
	setTimeout(reset,4000);
	database.ref().update({reset:false});
	$("#messagesDiv").empty();
	database.ref().update({chat:null});

}

//rearrange which HTML elements are showing for new game
var reset = function(){
	$("#message").empty();
	$("#choices1").addClass("hidden");
	$("#choices2").addClass("hidden");
	$("#player-1-start").removeClass("hidden");
	$("#p1-form").removeClass("hidden");	
	$("#player-1-title").text("Player 1");
	$("#player-2-start").removeClass("hidden");
	$("#p2-form").removeClass("hidden");	
	$("#player-2-title").text("Player 2");
	console.log("reset function");

}

//the chat is the part of this where I "repurposed" someone else's code.  Had to 
//change plenty of it to make it work.  Just ran out of time to really get it without help. 
var chat = database.ref("chat/");

$('#messageInput').keypress(function (e) {
        if (e.keyCode == 13) {
        	var name;
          if (you == 'player1'){
          	name = player1.name;
          }
          else if (you == 'player2'){
          	name = player2.name;
          }
          else {
          	name = "Guest";
          }
          var text = $('#messageInput').val();
          chat.push({name: name, text: text});
          $('#messageInput').val('');
        }
      });
      chat.on('child_added', function(snapshot) {
        var message = snapshot.val();
        displayChatMessage(message.name, message.text);
      });
      function displayChatMessage(name, text) {
        $('<div/>').text(text).prepend($('<em/>').text(name+': ')).appendTo($('#messagesDiv'));
        $('#messagesDiv')[0].scrollTop = $('#messagesDiv')[0].scrollHeight;
      };


$(document).ready(function () {
	//listen for p1 log in, send to database
	$("#player-1-start").on("click",function(event){	
		event.preventDefault();
		var name1 = $("#name1").val();
		you = 'player1';
		database.ref('player1/').set(
			{	name: name1,
				wins: 0,
				losses: 0,
				currentPick: 'none'
			}
		)
	})

	$("#player-2-start").on("click",function(event){
		event.preventDefault();
		var name2 = $("#name2").val();
		you = 'player2';
		database.ref('player2/').set(
			{	name: name2,
				wins: 0,
				losses: 0,
				currentPick: 'none'
			}
		)
	})

	//listen for choices, send to database
	$(".choices").on("click",function(){
		var currentPick = $(this).attr("data-selection");
		database.ref(you + '/').update({currentPick:currentPick});

	})

})


