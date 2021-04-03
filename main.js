const { authenticatedClient, FileTokenStorage } = require('liquidx-gapi-auth')
const { program } = require('commander');
const process = require('process');
const Photos = require('googlephotos');
const fs = require('fs');

const SCOPES = ['https://www.googleapis.com/auth/photoslibrary.readonly'];

const albumListRecursive = async (accessToken, pageSize = 50) => {
  const photos = new Photos(accessToken)

  const getNextAlbumPage = async (albums, nextPageToken) => {
    const result = await photos.albums.list(pageSize, nextPageToken)
    result.albums.map(o => {
      albums.push(o.title)
    })
    console.log(result.nextPageToken, result.albums.length)

    if (result.nextPageToken && result.albums.length > 0) {
       await getNextAlbumPage(albums, result.nextPageToken)
    }
    return albums
  }

  return getNextAlbumPage([])
}

const albumList = async (accessToken, pageSize = 20) => {
  const photos = new Photos(accessToken)
  const albums = []
  let hasNext = true
  let nextPageToken = ''

  while (hasNext) {
    const result = await photos.albums.list(pageSize, nextPageToken)
    result.albums.map(o => {
      albums.push(o)
      console.log(o.title);
    })
    nextPageToken = result.nextPageToken
    hasNext = (result.albums.length > 0) && (typeof nextPageToken != 'undefined')
    console.log(`Got ${result.albums.length} albums. Making next request = ${hasNext}`)
  }
  console.log('end')

  return albums;
}

const main = () => {
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
      response.client.refreshAccessToken()
        .then(({credentials}) => {
          storage.writeToken(credentials)
          return albumList(credentials.access_token)
        })
        .then(albums => {
          console.log(albums)
          fs.writeFileSync('albums.json', JSON.stringify(albums))
        })
        .catch(err => {
          console.error(err)
        })
    }
  })

}

main()


