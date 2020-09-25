// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
var chatAuthors = {};
var authors = [];

function prefixSuffix(arr, prefix, suffix) {
  var result = "";
  arr.forEach(function(item) {
     result+=prefix+item+suffix;
  });
  return result;
}
window.addEventListener('DOMContentLoaded', () => {
  console.log('Yuika');
  $("#auth-dialog").hide();
  $("#video-id-dialog").hide();
  $("#control-panel").hide();
  $("#movie").hide();

  window.addEventListener('ask-video-id', (event) => {
     $("#video-id-dialog").show();
  });
  window.addEventListener('ask-auth-url', (event) => {
     $("#auth-dialog").show();
     var URL = event.detail;
     $("#auth-url").attr('href',event.detail);
  });

  function submitVideoUrl() {
    var inputVideoId = $('#video-id').val();
    $("#video-id-dialog").hide();    
    window.postMessage({ event: 'get-video-id', value: inputVideoId});
  };

  function submitAuthCode() {
    var inputAuthCode = $('#auth-code').val();
    $("#auth-dialog").hide();    
    
    window.postMessage({ event: 'get-auth-code', value: inputAuthCode});
  };

  var buttonVideoIdSubmit = $('#video-id-submit');
  console.log(buttonVideoIdSubmit);
  buttonVideoIdSubmit.click(submitVideoUrl);
  window.addEventListener('chat-author', (event) => { 
    $("#control-panel").show();
    console.log('Chat author get');
    
    var author = event.detail;
    chatAuthors[author] = 'exists';
    authors = Object.keys(chatAuthors);
    $("#credits").html(prefixSuffix(authors,"<div class='credit-one'>","</div>"));
  });

  var buttonMovie = $('#movie-start');
  buttonMovie.click(() => {
    var windowHeight = $(window).height();
    var windowWidth = $(window).width();
    var duration = parseInt($("#duration").val());
    var movieHeight = $('#movie').height();

    $('#control-panel').hide();
    $('#movie').stop();
    $('#movie').show();
    $('#movie').css({'bottom':  0, 'position': 'absolute', left: 0, width: windowWidth });
    $('#movie').animate({'bottom': windowHeight+movieHeight}, duration, 'linear', function() {       
      $('#control-panel').show();
      $('#movie').stop();
      $('#movie').hide();
    });
  });
});
