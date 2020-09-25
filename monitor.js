var fs = require('fs');
var readline = require('readline');
var {google} = require('googleapis');
var OAuth2 = google.auth.OAuth2;

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/youtube-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/youtube.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'youtube-nodejs-quickstart.json';

  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

var emitter = null;
var ipc = null;

// Load client secrets from a local file.
function startLiveChatMonitoring(webContents,ipcMain) {
  emitter = webContents;
  ipc = ipcMain;
  fs.readFile('client_secret.json', function processClientSecrets(err, content) {
    if (err) {
      console.log('Error loading client secret file: ' + err);
      return;
    }
    // Authorize a client with the loaded credentials, then call the YouTube API.
    authorize(JSON.parse(content), getChannel);
  });
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Asking to authenticate with url');
  emitter.send('data',{event: 'ask-auth-url', value: authUrl});
  ipc.on('get-auth-code', function(event, code) {
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
    if (err) throw err;
    console.log('Token stored to ' + TOKEN_PATH);
  });
}

/**
 * Lists the names and IDs of up to 10 files.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function getChannel(auth) {
  console.log('Asking video ID');
  emitter.send('data',{event: 'ask-video-id'});
  ipc.on('get-video-id', function(event, code) {
    var service = google.youtube('v3');
    service.liveBroadcasts.list({
      auth: auth,
      part: "snippet",
      id: code,
    }, function(err, response) {
      if (err) {
        console.log('The API returned an error: ' + err);
        return;
      }
      var liveBroadcast = response.data.items[0];
      var liveChatId = liveBroadcast.snippet.liveChatId;
      getMessages(service,auth,liveChatId);
    });
  });
}

var nextPageToken = '';
var pollingIntervalMillis = -1;
var chatAuthors = {};
function getMessages(service, auth, id) {
   service.liveChatMessages.list({
     auth: auth,
     part: 'snippet,authorDetails',
     liveChatId: id,
     pageToken: nextPageToken,
   }, function(err,response) {
     if (err) {
       console.log('The API returned an error: ' + err);
       return;
     }
     if(response.data.items.length > 0) {
       response.data.items.forEach(function(item) {
         emitter.send('data', {event: 'chat-author', value: item.authorDetails.displayName} );
       });
     }
     nextPageToken = response.data.nextPageToken;
     if(pollingIntervalMillis == -1) pollingIntervalMillis = response.data.pollingIntervalMillis;
     setTimeout(() => { getMessages(service, auth, id); }, pollingIntervalMillis);
   });
};

module.exports = { startLiveChatMonitoring }
