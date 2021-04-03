const { authenticatedClient, FileTokenStorage } = require('liquidx-gapi-auth');
const { program } = require('commander');
const process = require('process');
const Photos = require('googlephotos');
const fs = require('fs');

const SCOPES = ['https://www.googleapis.com/auth/photoslibrary.readonly'];

const albumListRecursive = async (accessToken, pageSize = 50) => {
  const photos = new Photos(accessToken);

  const getNextAlbumPage = async (albums, nextPageToken) => {
    const result = await photos.albums.list(pageSize, nextPageToken);
    result.albums.map((o) => {
      albums.push(o.title);
    });
    console.log(result.nextPageToken, result.albums.length);

    if (result.nextPageToken && result.albums.length > 0) {
      await getNextAlbumPage(albums, result.nextPageToken);
    }
    return albums;
  };

  return getNextAlbumPage([]);
};

const albumList = async (accessToken, pageSize = 20) => {
  const photos = new Photos(accessToken);
  const albums = [];
  let hasNext = true;
  let nextPageToken = '';

  while (hasNext) {
    const result = await photos.albums.list(pageSize, nextPageToken);
    result.albums.map((o) => {
      albums.push(o);
      console.log(o.title);
    });
    nextPageToken = result.nextPageToken;
    hasNext = result.albums.length > 0 && typeof nextPageToken != 'undefined';
    console.log(`Got ${result.albums.length} albums. Making next request = ${hasNext}`);
  }
  console.log('end');

  return albums;
};

const libraryList = async (accessToken, pageSize = 20) => {
  const photos = new Photos(accessToken);
  const items = [];
  let hasNext = true;
  let nextPageToken = '';

  while (hasNext) {
    const result = await photos.mediaItems.list(pageSize, nextPageToken);
    result.mediaItems.map((o) => {
      items.push(o);
      console.log(o);
    });
    nextPageToken = result.nextPageToken;
    hasNext = false // result.mediaItems.length > 0 && typeof nextPageToken != 'undefined';
    console.log(`Got ${result.mediaItems.length} items. Making next request = ${hasNext}`);
  }

  return items;
};

const main = () => {
  const storage = new FileTokenStorage('token.json');
  const getClient = async (authCode) => {
    const response = await authenticatedClient('credentials.json', SCOPES, storage, authCode);
    if (response.authUrl) {
      console.log('Open URL: ', response.authUrl);
      console.log('Run: node main.js auth <code>');
    }
    return response;
  };

  program
    .command('auth <authCode>')
    .description('Apply auth code')
    .action((authCode) => {
      getClient(authCode).then((response) => {
        if (!response.authUrl) {
          console.log('Success.');
        }
      });
    });

  program
    .command('albums')
    .description('List all albums')
    .action(() => {
      getClient().then((response) => {
        response.client
          .refreshAccessToken()
          .then(({ credentials }) => {
            storage.writeToken(credentials);
            return albumList(credentials.access_token);
          })
          .then((albums) => {
            console.log(albums);
            fs.writeFileSync('albums.json', JSON.stringify(albums));
          });
      });
    });

  program
    .command('library')
    .description('List all items in library')
    .action(() => {
      getClient().then((response) => {
        response.client
          .refreshAccessToken()
          .then(({ credentials }) => {
            storage.writeToken(credentials);
            return libraryList(credentials.access_token);
          })
          .then((items) => {
            console.log(items);
            fs.writeFileSync('items.json', JSON.stringify(items));
          });
      });
    });

  program.parse(process.argv);

};

main();
