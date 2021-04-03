const { authenticatedClient, FileTokenStoage } = require('liquidx-gapi-auth')
const { program } = require('commander');
const { google } = require("googleapis");
const process = require('process');
const Photos = require('googlephotos');

const listPhotos = (accessToken, pageSize = 50) => {
  const photos = new Photos(accessToken)
  return photos.albums.list(pageSize)
}

// If modifying these scopes, delete token.json.
const SCOPES = [
  'https://www.googleapis.com/auth/photoslibrary.readonly',
  'https://www.googleapis.com/auth/calendar.readonly'];


/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
 function listEvents(auth) {
  const calendar = google.calendar({version: 'v3', auth});
  calendar.events.list({
    calendarId: 'primary',
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const events = res.data.items;
    if (events.length) {
      console.log('Upcoming 10 events:');
      events.map((event, i) => {
        const start = event.start.dateTime || event.start.date;
        console.log(`${start} - ${event.summary}`);
      });
    } else {
      console.log('No upcoming events found.');
    }
  });
}


program.option('-a, --auth-code <auth>', 'Auth code from server.')
program.parse(process.argv)
const options = program.opts();

const storage = new FileTokenStoage('token.json')

authenticatedClient(SCOPES, storage, options.authCode).then(response => {
  if (response.authUrl) {
    console.log('Open URL: ', response.authUrl)
    console.log('Run: node index.js --auth-code <code>')
    return
  } else {
    listEvents(response.client)

    storage.readToken()
      .then(tokens => {
        return listPhotos(tokens.access_token)
      })
      .then(response => {
        console.log(response)
      })
  }
})