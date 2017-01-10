
var info = [];
var getInfo = function(videoId){
  $.ajax({
     url: "https://www.googleapis.com/youtube/v3/videos?id="+ videoId +"&key=" + key + "&part=snippet,contentDetails&fields=items(id,snippet,contentDetails)",
     data: {
        format: 'json'
     },
     error: function() {
        $('#info').html('<p>An error has occurred</p>');
     },
     dataType: 'jsonp',
     success: function(data) {
       var myData = {};
       myData.id = data.items[0].id;
       myData.title = data.items[0].snippet.title;
       myData.duration = data.items[0].contentDetails.duration;

       info.push(myData);
     },
     type: 'GET'
  });
}
//$('#videobox > div:nth-child(2)').YTPPlay()
var mute = function(){
  var t = $('#video1').get(0)
  t.player.setVolume( 0 );
  if( t.volumeBar && t.volumeBar.length && t.volumeBar.width() > 10 ) {
    t.volumeBar.updateSliderVal( 0 );
  }
}
t = $('#video1').get(0);
var fadeOut = function(){
  var t = $('#video1').get(0)
  t.player.setVolume( 0 );
  if( t.volumeBar && t.volumeBar.length && t.volumeBar.width() > 10 ) {
    t.volumeBar.updateSliderVal( 0 );
  }
  //.animate({1.0: 0.0}, 1000);
}

function getSoundAndFadeAudio (audiosnippetId) {

    var sound = document.getElementById(mbYTP_video1);

    // Set the point in playback that fadeout begins. This is for a 2 second fade out.
    var fadePoint = sound.duration - 2;

    var fadeAudio = setInterval(function () {

        // Only fade if past the fade out point or not at zero already
        if ((sound.currentTime >= fadePoint) && (sound.volume != 0.0)) {
            sound.volume -= 0.1;
        }
        // When volume at zero stop all the intervalling
        if (sound.volume === 0.0) {
            clearInterval(fadeAudio);
        }
    }, 200);

}
var addVideo = function (videoId){
  $('#videobox').append('<div class=\"player\" data-property=\"{videoURL:\'https://www.youtube.com/watch?v='+ videoId +'\',containment:\'self\',autoPlay:false, mute:true, startAt:0, opacity:1, stopMovieOnBlur:false}\">My video</div>')

//  info = getInfo(videoId);
  //console.log(info);
  var queueLength = $('#videobox > div').length;
  console.log(queueLength);
  $('#videobox > div:nth-child('+ queueLength +')').YTPlayer();
}

$(document).ready(function() {
    //do jQuery stuff when DOM is ready
    //jQuery.mbYTPlayer.apiKey = "" //give key to the library
    $('#videobox > div:nth-child(1)').YTPlayer();
    $('#videobox > div:nth-child(2)').YTPlayer();
  //  getInfo("oHg5SJYRHA0");
//    addVideo('EyoutEHpPAU');


addVideo("EyoutEHpPAU");
//getInfo("EyoutEHpPAU");

});
