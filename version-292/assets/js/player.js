import { H as Hls } from "./hls-vendor.js";

export function initPlayer(videoId, buttonId, overlayId, sourceUrl) {
  var video = document.getElementById(videoId);
  var button = document.getElementById(buttonId);
  var overlay = document.getElementById(overlayId);
  var hls = null;
  var loaded = false;

  if (!video || !button || !overlay || !sourceUrl) {
    return;
  }

  function loadVideo() {
    if (loaded) {
      return;
    }
    loaded = true;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = sourceUrl;
    } else if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90
      });
      hls.loadSource(sourceUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, function (_, data) {
        if (!data || !data.fatal || !hls) {
          return;
        }
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad();
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
        } else {
          hls.destroy();
        }
      });
    } else {
      video.src = sourceUrl;
    }
  }

  function playVideo() {
    loadVideo();
    overlay.classList.add("is-hidden");
    var action = video.play();
    if (action && typeof action.catch === "function") {
      action.catch(function () {
        overlay.classList.remove("is-hidden");
      });
    }
  }

  overlay.addEventListener("click", playVideo);
  button.addEventListener("click", playVideo);
  video.addEventListener("click", function () {
    if (video.paused) {
      playVideo();
    } else {
      video.pause();
    }
  });
  video.addEventListener("play", function () {
    overlay.classList.add("is-hidden");
  });
  video.addEventListener("pause", function () {
    if (!video.ended) {
      overlay.classList.remove("is-hidden");
    }
  });
  video.addEventListener("ended", function () {
    overlay.classList.remove("is-hidden");
  });
}
