
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

var fadeInTimers = [];
function fadeIn(duration) {
    //video1.YTPSetVolume(undefined); acts like mute/unmute if called twice, but also resets the volume to about 10.
    var video1 = $('#videobox > div:nth-child(1)');
    var timer;
    var volume = 10; //Vol=0 or Mute followed by <10 goes to 10

    var fadeAudio = function () {
      video1.YTPSetVolume(volume);
      volume++;
      if(volume > 100) {
        clearTimeout(timer);
        console.log("Fade in complete")
      }
    };

    video1.YTPPlay();
    video1.YTPSetVolume(0);
    /*
    multiply by 1000 to get to Seconds
    divide by numberOfVolumeBumps
    */
    timer = setInterval(fadeAudio, duration*1000/90);
    return timer; //returning timer so that the fade in can be stopped.
}

function fadeOut(duration) {
    var video1 = $('#videobox > div:nth-child(1)');
    var timer;
    var currentVolume = video1[0].opt.vol
    var volume = currentVolume - 1 //Setting volume to what it already is acts as mute...

    var fadeAudio = function () {
      video1.YTPSetVolume(volume);
      volume--;
      if(volume < 0){
        clearTimeout(timer);
        video1.YTPPause()
        console.log("Fade out complete")
      }
    };
    timer = setInterval(fadeAudio, duration*10);
}




var player1 = $('#videobox > div:nth-child(1)')
console.log("beep")
$('#videobox > div:nth-child(1)').on("YTPData",function(e){
   var currentTime = e.time;
   console.log(currentTime)

   //your code goes here
});

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

      self.selectedSong = ko.observable();//For draggable

      self.currentSong = ko.observable(new Song());
      self.newSongId = ko.observable();

      self.inSpeed = ko.observable(3);
      self.outSpeed = ko.observable(3);
      self.overlap = ko.observable(6);
      self.fadeInTimer = null;
      self.video1Volume = ko.observable(0);

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
        self.pause();
        self.currentSong(self.songs.shift());
        self.addVideo(self.songs()[0].id())
      };
      self.play = function() {
        console.log(self.currentSong().title())
        //Auto skip if song is empty
        if(self.currentSong().title() === ""){
          self.skip();
        }
        self.fadeInTimer = fadeIn(self.inSpeed());
      };
      self.pause = function() {
        clearTimeout(self.fadeInTimer)//Stop the fade in.
        fadeOut(self.outSpeed());
      };

      self.isSongSelected = function(song) {
         return song === self.selectedSong();
      };

      self.addVideo = function (videoId){
        $('#videobox').append('<div class=\"player\" data-property=\"{videoURL:\'https://www.youtube.com/watch?v='+ videoId +'\',containment:\'self\',autoPlay:false, mute:true, startAt:0, opacity:1, showControls:false, stopMovieOnBlur:false}\"></div>')

        var queueLength = $('#videobox > div').length;
        var player = $('#videobox > div:nth-child('+ queueLength +')');
        player.YTPlayer();

        player.on("YTPReady",function(e){
          console.log("Video loaded!")
          var totalTime = player[0].opt.containment[0].totalTime
          console.log(totalTime)
          player.on("YTPTime",function(e){
            var currentTime = e.time;
            if(totalTime - currentTime - 120 === 0){
              console.log("load the next song!!!!!")
            }
            console.log(currentTime + " (take off in " + (totalTime - currentTime - 120) + ")")
         });
      });
    }



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
