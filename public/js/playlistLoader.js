var prevPageToken, nextPageToken, playlistId;
var videoId = 'JHu2-6BkpGE';
var params = { allowScriptAccess: "always" };
var atts = { id: "myytplayer" };
swfobject.embedSWF("http://www.youtube.com/v/" + videoId + "?enablejsapi=1&playerapiid=ytplayer&version=3&modestbranding=1",
                         "ytapiplayer", "720", "576", "8", null, null, params, atts);
var ytplayer = document.getElementById("myytplayer");

function onYouTubePlayerReady(playerId) {
  ytplayer.loadPlaylist({list:"PL5zBq0esgY8RRRdBEK4YNXChW2jQbXsQc"});
  ytplayer.setShuffle(true);
}
playlistId = 'PL5zBq0esgY8RRRdBEK4YNXChW2jQbXsQc';
var apiKey = "AIzaSyBjCSouNb1proX81bkScaPyXMqJZP1lOgM";
function googleApiClientReady(){
  console.log('loading api');
  gapi.client.load('youtube', 'v3', youtubeApiReady);
}
function youtubeApiReady(){
  console.log("setting api key.");
  gapi.client.setApiKey(apiKey);
  //the call to get playlist has to be changed into the html body so different playlists can be loaded
  getPlaylist(playlistId);
  getAllPlaylists();
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
      $('#playlist-container').empty();
      $.each(playlistItems, function (index, item) {
        listPlaylists(item);
      });
    } else {
      console.log("no items");
    }
  });
};
  
function getPlaylist(playlistId, pageToken){
  console.log("getting playlist maybe");
  console.log(playlistId);
  var requestOptions = { 
    'part' : 'snippet',
    'playlistId'  : playlistId,
    'maxResults' : 10
  }
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
      $('#video-container').empty();
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
  //$('#video-container').append("<a href='' onclick='loadVid(" + videoId + ")'>" + title + "</a>");
}
function nextPage(){
  getPlaylist(playlistId, nextPageToken);
}
function prevPage(){
  getPlaylist(playlistId, prevPageToken);
}
function listPlaylists(item){
  var title = item.snippet.title;
  var playlistId = item.id;
//  $('#playlist-container').append("<p><a href='#' onclick='getPlaylist(" + playlistId + ")'>" + title + '</a></p>');
  //$('#playlist-container').append("<p onclick='getPlaylist('" + playlistId + "')'>" + title + "</p>");

//  $('#playlist-container').append('<p>' + title + ' - ' + playlistId + '</p>');
}

function loadVid(id){
  ytplayer.loadVideoById(id);
}