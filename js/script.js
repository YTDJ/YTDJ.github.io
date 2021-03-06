




$(document).ready(function() {
  //Draggable operations
  //http://www.knockmeout.net/2012/02/revisiting-dragging-dropping-and.html
$('#cachingPopover').popover()


  var ViewModel = function() {
      var self = this;

      var Song = function(id) {
        this.title = ko.observable("! - Cannot load '" + id + "'");
        this.id = id;
        getTitle(id, this);
      }
      var getTitle = function(videoId, SongObj){
        var url = 'https://www.youtube.com/watch?v=' + videoId;

        $.getJSON('https://noembed.com/embed',
        {format: 'json', url: url}, function (data) {
          if(data.error){
          }else{
            SongObj.title(data.title)
            console.log("Adding " + videoId +": "+ data.title);
          }
        })
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
      var writeToStorage = function(){
        //Write only IDs to storage
        var songs = JSON.stringify(self.songs())
        if (typeof(Storage) !== "undefined") {
          if(localStorage.getItem("cacheEnabled") === "true"){
            localStorage.setItem("playlist", songs);
          }
        }
      }
      //For draggable
      self.selectedSong = ko.observable();
      self.songs = ko.observableArray([]);
      self.songs.subscribe(function(){writeToStorage()});
      self.addNewSong = function() {
        //if there is nothing there, just quit.
        if(!this.newSongId()) return;

        var song = new Song(this.newSongId());
        self.selectedSong(song);
        self.songs.push(song);
        this.newSongId("");
      };
      self.addNewSong = function() {
        //if there is nothing there, just quit.
        if(!this.newSongId()) return;

        var song = new Song(this.newSongId());
        self.selectedSong(song);
        self.songs.push(song);
        this.newSongId("");
      };
      self.deleteSong = function(data, event) {
        self.songs.remove(data);
      };

      //Moving from song in draggable to actual video in DOM
      self.loadedVideos = ko.observableArray();
      self.loadVideo = function(videoLoadedCallback) {
        if(self.songs().length <= 0){
          console.log("Cannot load video, playlist is empty");
          return; //Only load 1 vidoo at a time.
        }
        if(self.loadingVideoNow){
          console.log("Cannot load another video, until this video is done loading.");
          return; //Only load 1 vidoo at a time.
        }
        self.loadingVideoNow = true;
        //grab the new song from top of playlist
        var newSong = self.songs.shift();
        //grab key data
        var videoId = newSong.id;
        var title = newSong.title();
        //add video to DOM uing ID
        $('#videobox').append('<div class=\"player\" data-property=\"{videoURL:\'https://www.youtube.com/watch?v='+ videoId +'\',containment:\'self\',autoPlay:false, startAt:0, opacity:1, showControls:true, loop:false, stopMovieOnBlur:false}\"></div>')

        var queueLength = $('#videobox > div').length;
        var player = $('#videobox > div:nth-child('+ queueLength +')');
        player.YTPlayer();

        player.on("YTPReady",function(e){
          self.loadedVideos.push(newVideo(player, title));
          self.loadingVideoNow = false;
          //For some reason, the time attached to video is about 3 sec too long.
          var totalTime = player[0].opt.containment[0].totalTime - 4
          //run the callback if one was passed

          //These run every second while the song is playing
          player.on("YTPTime",function(e){
            var currentTime = e.time;
            self.loadedVideos
            //Auto fadeX
            if(totalTime - currentTime - self.crossfadeDuration() - self.bufferDuration() === 0){
              console.log("Autoloading next song.")
              self.loadVideo(function(){self.skip()})
            }
          //  console.log(totalTime +" - " + currentTime + " - " + self.crossfadeDuration() +" = " + (totalTime - currentTime - self.crossfadeDuration()))
         });
         if(videoLoadedCallback) videoLoadedCallback();
      });
    }
    self.fadeIn = function(videoNumber) {
      self.playing(true);
      //Note: videoNumbers are 1 indexed!!
        var video1 = $('#videobox > div:nth-child(' + videoNumber +')');
        //var timer;
        var volume = 10; //Vol=0 or Mute followed by <10 goes to 10

        var fadeAudio = function () {
          video1.YTPPlay();
          video1.YTPSetVolume(volume);
          volume++;
          if(volume > 100) {
            clearTimeout(self.fadeInTimer);
            self.fadeInTimer = null;
            self.transitioning(false);
          }
        };

        video1.YTPSetVolume(0);
        video1.YTPPlay();
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
            self.transitioning(false);
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

      self.fadex = function(){self.fade(true)}

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
      self.transitioning = ko.observable(false);
      self.fadeInTimer = null;


      self.currentSong = ko.observable(new Song());
      self.newSongId = ko.observable();

      //Constants
      self.inSpeed = ko.observable(6);
      self.outSpeed = ko.observable(6);
      //crossfadeDuration = 0 => fade out completely, then fade in completely
      //crossfadeDuration = outSpeed => start fading out/in at the same time
      //crossfadeDuration > outspeed => clip end of song that is playing
      self.crossfadeDuration = ko.observable(self.outSpeed());
      self.bufferDuration = ko.observable(3);//guess for how long the videos are taking to load



      self.skip = function() {
        if(self.transitioning())return;
        self.transitioning(true);

        if(!self.playing()){
          self.dropVideo();
          self.loadVideo(function(){self.transitioning(false)});
        }

        //crossfade if a song is ready, else load, then crossfade
        if(self.loadedVideos().length > 1){
          self.fadex();
        }else{
          self.loadVideo(function (){self.fadex()});
        }
      };
      self.play = function() {
        if(self.transitioning())return;
        self.transitioning(true);

        $('#settings').hide()

        if(self.loadedVideos().length === 0){
          self.loadVideo(function(){self.fadeIn(1)});
        }else{
          self.fadeIn(1);
        }
      };
      self.pause = function() {
        if(self.transitioning())return;
        self.transitioning(true);

        self.fade();
      };

      self.isSongSelected = function(song) {
         return song === self.selectedSong();
      };

      self.exportPlaylist = function() {
        var songs = ko.toJSON(self.songs())
        //console.log(JSON.stringify(songs, null, 2))
        songs = JSON.parse(songs)
        songs = JSON.stringify(songs, null, 2);
        $("#exportDialog").dialog();
        $("#exportDialog > textarea").html(songs)
      };
      self.importPlaylist = function() {
        $("#importDialog > textarea").val("");
        $("#importDialog").dialog();
      };
      self.importNow = function() {
        if($( "#clearPlaylist" ).prop('checked')){
          self.songs.removeAll();
      }
        var rawInput = $( "#importDialog > textarea" ).val();
        $("#importDialog").dialog('close');
        var input = JSON.parse(rawInput);
        for (var i = 0; i < input.length; i++) {
          console.log(input[i].id)
          self.songs.push(new Song (input[i].id))
        }
      };

      if (typeof(Storage) !== "undefined") {
        //init cacheEnabled checkbox to stored value
        if(localStorage.getItem("cacheEnabled") === "true"){
          $('#cacheEnabled').prop('checked', true)
        } else{
          $('#cacheEnabled').prop('checked', false)
        }

        //wire up the cacheEnabled checkbox for future changes
        $('#cacheEnabled').change(function(){
          if($('#cacheEnabled').prop('checked')){
            localStorage.setItem("cacheEnabled", "true");
            writeToStorage()
          } else{
            localStorage.setItem("cacheEnabled", "false");
          }
        })

        //load up cached playlist | default songs
        if(localStorage.getItem("cacheEnabled") === "true"){
          console.log("Cache enabled, loading cached playlist")
            var cachedPlaylist = JSON.parse(localStorage.getItem("playlist"));
            for (var i = 0; i < cachedPlaylist.length; i++) {
              self.songs.push(new Song (cachedPlaylist[i].id))
            }

        }else{
          self.songs.push(new Song("EyoutEHpPAU"))
          self.songs.push(new Song("Eco4z98nIQY"))
          self.songs.push(new Song("U9t-slLl30E"))
        }
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
});
