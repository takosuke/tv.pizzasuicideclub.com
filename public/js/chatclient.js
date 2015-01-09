/*
GLOBAL VARS
*/


/*
Functions
*/
function toggleNameForm() {
   $("#login-screen").toggle();
}

function toggleChatWindow() {
  $("#chat").toggle();
  bindScroll();
}

function bindScroll() {
  $("#msgs").bind("DOMSubtreeModified",function() {
    $("#msgs").animate({
      scrollTop: $("#msgs")[0].scrollHeight
    });
  });
}



$(document).ready(function(){
  var chatVol = 0.2;
  var initialChatHeight = $("#main-chat-screen").height();
  var socket = io();
  $("#chat-controls-openclose, #chat-controls-sound, #chat-controls-history").css('cursor', 'pointer');
  $("form").submit(function(event){
    event.preventDefault();
  });

  $("#chat").hide();
  $("#errors").hide();
  $("#name").focus();
  $("#join").attr('disabled', 'disabled');
  
  if ($("#name").val() === "") {
    $("#join").attr('disabled', 'disabled');
  }
  
  //enter screen
  $("#nameForm").submit(function(){
    var name = $("#name").val();
    if (name === "" || name.length < 2) {
      $("#errors").empty();
      $("#errors").append("please enter a name please");
      $("#errors").show();
    } else {
      socket.emit("joinserver", name);
      toggleNameForm();
      toggleChatWindow();
      $("#msg").focus(); 
    }
  });
  
  $("#name").keypress(function(e){
    var name = $("#name").val();
    if(name.length < 2) {
      $("#join").attr('disabled', 'disabled'); 
    } else {
      $("#errors").empty();
      $("#errors").hide();
      $("#join").removeAttr('disabled');
    }
  });
  
  //main chat screen
  $("#chatForm").submit(function(){
    var msg = $("#msg").val();
    if (msg != "") {
      socket.emit("send", msg);
      $("#msg").val("");
    }
  });
  
  $("#chat-controls-sound").click(function(){
    if (chatVol != 0) {
      chatVol = 0;
      $("#chat-controls-sound").html("SOUND ON");
    } else {
      chatVol = 0.2;
      $("#chat-controls-sound").html("SOUND OFF");
    }
    
  });
  
  $("#chat-controls-openclose").click(function(){
    $("#main-chat-screen").toggle();
    if ($("#main-chat-screen").is(':visible')) {
      $("#main-chat-screen").height(initialChatHeight);
      $("#chat-controls-openclose").html("CLOSE");
    } else { 
      $("#main-chat-screen").height(0);
      $("#chat-controls-openclose").html("OPEN");
    }
  });
  
  
  socket.on("history", function(data) {
    if (data.length != 0) {
      $.each(data, function(index, msg) {
        $("#msgs").append("<li>" + msg.msg + "</li>");
      });
    }
  });
  

  socket.on("update", function(msg) {
    $("#msgs").append("<li class='update'>" + msg + "</li>");
  });

  socket.on("chat", function(msg) {
    $("#msgs").append("<li>" + msg + "</li>");
    freq = Math.floor(Math.random() * 300) + 130;
    r = Math.floor(Math.random() * 500) + 100;
    console.log(r);
    T('perc', {r:r},T('sin', {mul : chatVol, freq : freq})).on('ended', function(){
     this.pause();
    }).bang().play();
  });

  socket.on("update-people", function(data){
    $("#people").empty();
    $('#people').append("<li class='count'>"  + data.count +" ppl online</li>");
    $.each(data.people, function(a, obj) {
    $('#people').append("<li><span>" + obj.name + "</span></li>");
    });
  });
  
  socket.on("disconnect", function(){
    $("#msgs").append("<li><strong><span class='text-warning'>The server is not available</span></strong></li>");
    $("#msg").attr("disabled", "disabled");
    $("#send").attr("disabled", "disabled");
  });
  
});