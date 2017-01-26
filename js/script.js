
var getInfo = function(videoId, SongObj){ //SongObj param is optional
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
       myData.duration = parseTimeStamp(data.items[0].contentDetails.duration);
       if(SongObj === undefined){ //if no SongObj was passed
         console.log(myData);
         return myData;
       } else { //write results to SongObj
         console.log("Adding " + SongObj.id());
         SongObj.title(myData.title)
         SongObj.duration(myData.duration.pretty)
         console.log(SongObj.title());
       }
     },
     type: 'GET'
  });
}

var parseTimeStamp = function (input){
  var reptms = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;
  var duration = {}

  if (reptms.test(input)) {
    var matches = reptms.exec(input);
    duration.hours = (matches[1])?Number(matches[1]):0;
    duration.minutes = (matches[2])?Number(matches[2]):0;
    duration.seconds = (matches[3])?Number(matches[3]):0;
    duration.totalseconds = duration.hours * 3600  + duration.minutes * 60 + duration.seconds;

    duration.pretty = "";
    if(duration.hours){duration.pretty += duration.hours + ":"}
    duration.pretty += duration.minutes + ":"+ duration.seconds;
  }
  return duration;
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

// window.setInterval(function(){
// }, 5000);



function fadeIn(duration) {
    var video1 = $('#videobox > div:nth-child(1)');
    var volume = 1; //Start at 1 to avoid 'unmute' jitter caused by library ln1009
    var timer;
    var duration = 12;

    var fadeAudio = function () {
      console.log("Fading in: " + volume + "")
      video1.YTPSetVolume(volume);
      volume++;
      if(volume > 100) clearTimeout(timer);
    };

    video1.YTPPlay();
    video1.YTPSetVolume(volume);
    /*
    Convert to MS: durationMS = duration * 1000
    Spread out the 100 volume shifts over the duration:
    bumpVolumeEvery = durationMS / 100
    Or just cancel zeros. 1000/100 = 10 :)
    */
    timer = setInterval(fadeAudio, duration*10);
}


var addVideo = function (videoId){
  $('#videobox').append('<div class=\"player\" data-property=\"{videoURL:\'https://www.youtube.com/watch?v='+ videoId +'\',containment:\'self\',autoPlay:false, mute:true, startAt:0, opacity:1, showControls:false, stopMovieOnBlur:false}\"></div>')

  var queueLength = $('#videobox > div').length;
  console.log(queueLength);
  $('#videobox > div:nth-child('+ queueLength +')').YTPlayer();
}

var crossfade = function(){
  var video1 = $('#videobox > div:nth-child(1)');
  var timeStatus = video1.YTPManageProgress()
  var currentTime = 12//timeStatus.currentTime;
  var totalTime = timeStatus.totalTime;
  console.log(timeStatus);
  addVideo(self.songs()[0]);
};

$(document).ready(function() {
  //Draggable operations
  //http://www.knockmeout.net/2012/02/revisiting-dragging-dropping-and.html
  var Song = function(id) {
    if(id === undefined){//no arg passed => create blank song
      this.title = ko.observable("");
      this.timeLeft = ko.observable("-:--");
    }else{
      this.title = ko.observable("!!! - Cannot load metadata for '" + id + "'");
      this.id = ko.observable(id);
      this.duration = ko.observable("");
      this.timeLeft = ko.observable("-:--");
      this.durationSeconds = ko.observable(null);
      getInfo(id, this);
    }
  }

  var ViewModel = function() {
      var self = this;
      self.songs = ko.observableArray([
          new Song("oHg5SJYRHA0"),
          new Song("EyoutEHpPAU")
      ]);

      self.currentSong = ko.observable(new Song());
      self.selectedSong = ko.observable();
      self.newSongId = ko.observable();
      self.crossfadeLength = ko.observable(6);

      self.deleteSong = function(data, event) {
          self.songs.remove(data);
      };

      self.addNewSong = function() {
        //grab id from var bound to input field
          var song = new Song(this.newSongId());
          self.selectedSong(song);
          self.songs.push(song);
          this.newSongId("");
      };

      self.skip = function() {
        self.currentSong(self.songs.shift());
      };
      self.play = function() {
        console.log(self.currentSong().title())
        if(self.currentSong().title() === ""){
          self.currentSong(self.songs.shift());
        }
        fadeIn();
      };
      self.pause = function() {
        console.log("Pause...")
      };

      self.isSongSelected = function(song) {
         return song === self.selectedSong();
      };

  };

  //control visibility, give element focus, and select the contents (in order)
  ko.bindingHandlers.visibleAndSelect = {
      update: function(element, valueAccessor) {
          ko.bindingHandlers.visible.update(element, valueAccessor);
          if (valueAccessor()) {
              setTimeout(function() {
                  $(element).find("input").focus().select();
              }, 0); //new songs are not in DOM yet
          }
      }
  };

  ko.applyBindings(new ViewModel());
  $('#videobox > div:nth-child(1)').YTPlayer();







    //do jQuery stuff when DOM is ready
    //jQuery.mbYTPlayer.apiKey = "" //give key to the library

//    $('#videobox > div:nth-child(2)').YTPlayer();
  ///  getInfo("oHg5SJYRHA0");
//    addVideo('EyoutEHpPAU');


//addVideo("EyoutEHpPAU");
//getInfo("EyoutEHpPAU");


});
