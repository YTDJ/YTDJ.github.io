
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
         console.log("Adding " + SongObj.id);
         SongObj.title(myData.title)
         SongObj.duration(myData.duration.pretty)
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




var player1 = $('#videobox > div:nth-child(1)')
console.log("beep")
$('#videobox > div:nth-child(1)').on("YTPData",function(e){
   var currentTime = e.time;
   console.log(currentTime)

   //your code goes here
});

// var crossfade = function(){
//   var video1 = $('#videobox > div:nth-child(1)');
//   var timeStatus = video1.YTPManageProgress()
//   var currentTime = 12//timeStatus.currentTime;
//   var totalTime = timeStatus.totalTime;
//   console.log(timeStatus);
//   addVideo(self.songs()[0]);
// };

$(document).ready(function() {
  //Draggable operations
  //http://www.knockmeout.net/2012/02/revisiting-dragging-dropping-and.html
  var Song = function(id) {
    if(id === undefined){//no arg passed => create blank song
      this.title = ko.observable("");
    }else{
      this.title = ko.observable("!!! - Cannot load metadata for '" + id + "'");
      this.duration = ko.observable("");
      this.id = id;
      getInfo(id, this);
    }
  }

  var newVideo = function(video, title){
    var vid = {};
    vid.video = video;
    vid.title = title;
    vid.id = video[0].opt.containment[0].videoID;
    vid.totalTime = video[0].opt.containment[0].totalTime;
    vid.timeLeft = ko.observable("--:--");
    return vid;
  }



  var ViewModel = function() {
      var self = this;

      //For draggable
      self.selectedSong = ko.observable();
      self.songs = ko.observableArray([
        new Song("oHg5SJYRHA0"),
        new Song("EyoutEHpPAU"),
        new Song("Eco4z98nIQY"),
        new Song("EyoutEHpPAU"),
      ]);
      self.deleteSong = function(data, event) {
        self.songs.remove(data);
      };

      //Moving from song in draggable to actual video in DOM
      self.loadedVideos = ko.observableArray();
      self.skippingNow = false;
      self.loadVideo = function() {
        if(self.songs().length <= 0){
          console.log("Cannot load video, playlist is empty");
          return; //Only load 1 vidoo at a time.
        }
        if(self.loadingVideoNow){
          console.log("Cannot load another video, until this video is done loading.");
          return; //Only load 1 vidoo at a time.
        }
        //grab the new song from top of playlist
        var newSong = self.songs.shift();
        //add video to DOM uing ID
        self.addVideo(newSong.id, newSong.title());
      };
      self.addVideo = function (videoId, title){
        self.loadingVideoNow = true;
        $('#videobox').append('<div class=\"player\" data-property=\"{videoURL:\'https://www.youtube.com/watch?v='+ videoId +'\',containment:\'self\',autoPlay:false, mute:true, startAt:0, opacity:1, showControls:true, loop:false, stopMovieOnBlur:false}\"></div>')

        var queueLength = $('#videobox > div').length;
        var player = $('#videobox > div:nth-child('+ queueLength +')');
        player.YTPlayer();

        player.on("YTPReady",function(e){
          self.loadedVideos.push(newVideo(player, title));
          self.loadingVideoNow = false;



          //For some reason, the time attached to video is about 3 sec too long.
          var totalTime = player[0].opt.containment[0].totalTime - 4

          //These run every second while the song is playing
          player.on("YTPTime",function(e){
            var currentTime = e.time;
            self.loadedVideos
            //Auto fadeX
            if(totalTime - currentTime - self.crossfadeDuration() - self.bufferDuration() === 0){
              console.log("Autoloading next song.")
              self.loadVideo()
            }
            if(totalTime - currentTime - self.crossfadeDuration() === 0){
              self.skip()
            }


            console.log(totalTime +" - " + currentTime + " - " + self.crossfadeDuration() +" = " + (totalTime - currentTime - self.crossfadeDuration()))
         });
      });
    }
    self.fadeIn = function(videoNumber) {
      self.playing(true);
      //Note: videoNumbers are 1 indexed!!
        var video1 = $('#videobox > div:nth-child(' + videoNumber +')');
        //var timer;
        var volume = 10; //Vol=0 or Mute followed by <10 goes to 10

        var fadeAudio = function () {
          video1.YTPSetVolume(volume);
          volume++;
          console.log("Fade in")
          if(volume > 100) {
            clearTimeout(self.fadeInTimer);
            self.fadeInTimer = null;
            console.log("Fade in complete")
          }
        };

        video1.YTPPlay();
        video1.YTPSetVolume(0);
        /*
        multiply by 1000 to get to Seconds
        divide by numberOfVolumeBumps
        */
        //saving timer to a global so it can be killed
        self.fadeInTimer = setInterval(fadeAudio, self.inSpeed()*1000/90);
    }

    self.fadeOut = function(doDelete) {
        var video1 = $('#videobox > div:nth-child(1)');
        var timer;
        var currentVolume = video1[0].opt.vol
        var volume = currentVolume - 1 //Setting volume to what it already is acts as mute...

        var fadeAudio = function () {
          video1.YTPSetVolume(volume);
          volume--;
          if(volume < 0){
            clearTimeout(timer);
            video1.YTPPause();
            if(doDelete){
              self.dropVideo()
            }
            console.log("Fade out complete")
          }
        };
        timer = setInterval(fadeAudio, self.outSpeed()*10);
    }


      //Deleting video from DOM
      self.dropVideo = function() {
        //remove from DOM
        $('#videobox > div:nth-child(1)').remove()
        //remove from list
        self.loadedVideos.shift();
      };

      self.state = ko.observable("s"); //s_top, p_lay or t_ransition
      self.transitionInProgress = ko.observable(false);
      self.masterFade = function(mode){
        self.state("t");
        if(mode === "fadeOut"){
          //fade out
          self.state("s");
        }else if(mode === "fadeIn"){
          //load video1
          //fade in
          self.state("p");
        }else if(mode === "fadeX"){
          //load video1
          //fade out
          //fade in
          self.state("p");

        }
      }
      self.fade = function(doCrossfade){
        //Something fading in? Stop that.
        if (self.fadeInTimer !== null) {
          clearTimeout(self.fadeInTimer);
          self.fadeInTimer = null;
        }
        /*Trasnsitino, if desired*/
        if(!doCrossfade){
          //Must be just a pause. Fade out. Do NOT drop video 1
          self.fadeOut(false);
          self.playing(false);
        }else{
          //Start fading out what ever is playing, drop video 1 when done
          self.fadeOut(true);
          //Fade in new song, delay if desired.
          setTimeout(self.fadeIn(2), self.crossfadeDuration()*1000);
        }
      }

      //General State
      self.playing = ko.observable(false);
      self.fadeInTimer = null;
      self.skippingNow = false;


      self.currentSong = ko.observable(new Song());
      self.newSongId = ko.observable();

      //Constants
      self.inSpeed = ko.observable(6);
      self.outSpeed = ko.observable(6);
      //crossfadeDuration = 0 => fade out completely, then fade in completely
      //crossfadeDuration = outSpeed => start fading out/in at the same time
      //crossfadeDuration > outspeed => clip end of song that is playing
      self.crossfadeDuration = ko.observable(16);
      self.bufferDuration = ko.observable(3);


      self.addNewSong = function() {
        //grab id from var bound to input field
          var song = new Song(this.newSongId());
          self.selectedSong(song);
          self.songs.push(song);
          this.newSongId("");
      };
      self.skip = function() {
        //Don't do anything if no song is playing
        if(!self.playing()) return;
        //crossfade if a song is ready, else load, then crossfade
        if(self.loadedVideos().length > 1){
          self.fade(true);
        }else{
          self.loadVideo();
          console.log(1000*self.bufferDuration())
          var a = setTimeout(console.log("honk"), 3000);
          var b = setTimeout(self.fade(true), 1000*self.bufferDuration());
        }
      };
      self.play = function() {
        if(self.loadedVideos().length === 0){
          self.loadVideo();
        }else{
          self.fadeIn(1);
        }
      };
      self.pause = function() {
        self.fade(false);
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
  //$('#videobox > div:nth-child(1)').YTPlayer();







    //do jQuery stuff when DOM is ready
    //jQuery.mbYTPlayer.apiKey = "" //give key to the library

//    $('#videobox > div:nth-child(2)').YTPlayer();
  ///  getInfo("oHg5SJYRHA0");
//    addVideo('EyoutEHpPAU');


//addVideo("EyoutEHpPAU");
//getInfo("EyoutEHpPAU");


});
