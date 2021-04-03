const { authenticatedClient, FileTokenStorage } = require('liquidx-gapi-auth')
const { program } = require('commander');
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


program.option('-a, --auth-code <auth>', 'Auth code from server.')
program.parse(process.argv)
const options = program.opts();

const storage = new FileTokenStorage('token.json')

authenticatedClient('credentials.json', SCOPES, storage, options.authCode).then(response => {
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