var prevPageToken, nextPageToken, playlistId, ytplayer;
var videoId = 'JHu2-6BkpGE';
var params = { allowScriptAccess: "always" };
var atts = { id: "myytplayer" };
swfobject.embedSWF("http://www.youtube.com/v/" + videoId + "?enablejsapi=1&playerapiid=ytplayer&version=3&modestbranding=1",
                         "ytapiplayer", "720", "576", "8", null, null, params, atts);
var apiKey = "AIzaSyBjCSouNb1proX81bkScaPyXMqJZP1lOgM";


function googleApiClientReady(){
  console.log('loading api');
  gapi.client.load('youtube', 'v3', youtubeApiReady);
}
function onYouTubePlayerReady(playerId) {
  ytplayer = document.getElementById("myytplayer");
  ytplayer.addEventListener("onStateChange", "onPlayerStateChange");
  ytplayer.loadPlaylist({list:"PL5zBq0esgY8RRRdBEK4YNXChW2jQbXsQc"});
  ytplayer.setShuffle(true);
}
function youtubeApiReady(){
  playlistId = 'PL5zBq0esgY8RRRdBEK4YNXChW2jQbXsQc';
  console.log("setting api key.");
  gapi.client.setApiKey(apiKey);
  //the call to get playlist has to be changed into the html body so different playlists can be loaded
  getPlaylist(playlistId);
  getAllPlaylists();
}


function getPlaylist(playlistId, pageToken){
  
  var requestOptions = { 
    'part' : 'snippet',
    'playlistId'  : playlistId,
    'maxResults' : 10
  }
  var playlistRequestOptions = {
    'part' : 'snippet',
    'id' : playlistId
  }
  var playlistRequest = gapi.client.youtube.playlists.list(playlistRequestOptions);
  playlistRequest.execute(function(response){
    var playlistTitle = response.result.items[0].snippet.title;
    if (playlistTitle) {
      $("#playlist-title").html("LIST: " + playlistTitle);
    }
  });
  
  if (pageToken){
    requestOptions.pageToken = pageToken;
  }
  var request = gapi.client.youtube.playlistItems.list(requestOptions);
  request.execute(function(response){
    nextPageToken = response.result.nextPageToken;
    var nextVis = nextPageToken ? 'visible' : 'hidden';
    $('#next-button').css('visibility', nextVis);
    prevPageToken = response.result.prevPageToken;
    var prevVis = prevPageToken ? 'visible' : 'hidden';
    $('#prev-button').css('visibility', prevVis);
    var playlistItems = response.result.items;
    if (playlistItems) {
      $('#video-list-container').empty();
      $.each(playlistItems, function (index, item) {
        displayResult(item.snippet);
      });
    } else {
      console.log("no items");
    }
    
  });

}

function displayResult(videoSnippet){
  var title = videoSnippet.title;
  var videoId = videoSnippet.resourceId.videoId;
  var index = videoSnippet.position;
  var playlistId = videoSnippet.playlistId;
  $('#video-list-container').append("<a href='#' onclick='loadVid(" + index + ',\"' + playlistId + "\")'>" + title + "</a><br>");
}
function loadVid(videoId, playlistId){
  ytplayer.loadPlaylist({list:playlistId, index:videoId});
  
}

function displayVideoInformation(videoId) {
  var requestOptions = { part : "snippet", id : videoId }
  var request = gapi.client.youtube.videos.list(requestOptions);
  request.execute(function(response) {
    var title = response.items[0].snippet.title;
    var description = response.items[0].snippet.description.replace(/\n/g,"<br>");
    var infoHTML = "Currently playing:<h3>" + title + "</h3> \
                    <p>" + description + "</p>"
    $("#video-info").html(infoHTML);
    
  });
}
  

function listPlaylists(item){
  var title = item.snippet.title;
  var playlistId = item.id;
  $('#playlists').append("// <a href='#' onclick='getPlaylist(\"" + playlistId + "\")'>" + title + '</a> ');
}

function getAllPlaylists(pageToken){
  var requestOptions = {
    'part' : 'snippet',
    'channelId': 'UCmBskYKVmwCbh4LQRdslMJQ',
    'maxResults': 50
  }
  if (pageToken){
    requestOptions.pageToken = pageToken;
  }
  var request = gapi.client.youtube.playlists.list(requestOptions);
  request.execute(function(response){
    nextPageToken = response.result.nextPageToken;
    var nextVis = nextPageToken ? 'visible' : 'hidden';
    $('#next-list').css('visibility', nextVis);
    prevPageToken = response.result.prevPageToken;
    var prevVis = prevPageToken ? 'visible' : 'hidden';
    $('#prev-list').css('visibility', prevVis);
    var playlistItems = response.result.items;
    if (playlistItems) {
      $('#playlists').empty();
      $('#playlists').append("collections: ");
      $.each(playlistItems, function (index, item) {
        listPlaylists(item);
      });
    } else {
      console.log("no items");
    }
  });
};
function nextPage(){
  getPlaylist(playlistId, nextPageToken);
}
function prevPage(){
  getPlaylist(playlistId, prevPageToken);
}

function onPlayerStateChange(evt) {
  console.log(evt);
  if (evt === 1 ) {
    console.log("playing!");
    var url = ytplayer.getVideoUrl();
    var video_match = url.match(/[?&]v=([^&]+)/);
    var videoId = video_match[1];
    displayVideoInformation(videoId)
  }
}

