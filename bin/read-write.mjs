/**
 * Fetch, read and parse Gists, and write the bookmarks as a JSON Feed file.
 *
 * @copyright © Nick Freear, 06-Dec-2022.
 * @see https://octokit.github.io/rest.js/v19#gists-list-for-user
 * @see https://www.jsonfeed.org/version/1.1/
 */

import { Octokit } from '@octokit/rest';
import * as dotenv from 'dotenv';
import { promises as fs } from 'fs';

dotenv.config();

(async () => {
  const ITEMS = await fetchGists();

  writeBookmarksFeedJson(ITEMS);
})();

function getConfig (ENV = process.env) {
  const {
    GH_AUTH, GH_USERNAME, PER_PAGE, FEED_FILE, FEED_TITLE, FEED_LINK, FEED_AUTHOR, FEED_LOCALE
  } = ENV;

  const auth = GH_AUTH || null;
  const userAgent = 'nfreear/bookmarks 0.9';
  const username = GH_USERNAME || 'nick-test-14';
  const per_page = parseInt(PER_PAGE) || 5; /* eslint-disable-line camelcase */
  const FILE_NAME = FEED_FILE || './docs/bookmarks.json';

  const title = FEED_TITLE || 'My Bookmarks';
  const home_page_url = FEED_LINK || null; /* eslint-disable-line camelcase */
  const authors = [{ name: FEED_AUTHOR || 'Nick Freear' }];
  const language = FEED_LOCALE || 'en';
  const version = 'https://jsonfeed.org/version/1.1';

  console.debug('PER_PAGE:', PER_PAGE);

  return {
    auth, userAgent, username, per_page, FILE_NAME, title, home_page_url, authors, language, version
  };
}

async function fetchGists () {
  const { auth, userAgent, username, per_page } = getConfig(); /* eslint-disable-line camelcase */

  const octokit = new Octokit({ auth, userAgent });

  const GISTS = await octokit.rest.gists.listForUser({ username, per_page });

  // const remaining = parseInt(gists.headers['x-ratelimit-remaining']);
  // const reset = new Date(parseInt(gists.headers['x-ratelimit-reset'])).toISOString();

  const allItems = await GISTS.data.map(async ({ id, description }) => {
    const { data, headers } = await octokit.rest.gists.get({ gist_id: id });

    const remaining = parseInt(headers['x-ratelimit-remaining']);
    const reset = ''; // new Date(parseInt(headers['x-ratelimit-reset'])).toISOString();
    const bookmarkJson = data.files['my-bookmark.test.json'];
    const { content, language, size } = bookmarkJson;
    const bookmark = JSON.parse(content);

    console.debug('Gist:', remaining, language, size, reset, description, id);
    // console.debug('>>', data);
    // console.debug('>>', language, bookmark);

    await delay();

    const { title, text, tags, time, url } = bookmark;
    const _private = bookmark.private;

    return {
      title, url, content_text: text, tags, date_published: time, _private, id
    };
  });

  return await Promise.all(allItems);
}

function writeBookmarksFeedJson (items) {
  const { FILE_NAME, title, home_page_url, per_page, authors, language, version } = getConfig(); /* eslint-disable-line camelcase */
  const _time = new Date().toISOString();
  const _per_page = per_page; /* eslint-disable-line camelcase */
  const feed = { version, title, authors, language, home_page_url, _time, _per_page };

  fs.writeFile(FILE_NAME, JSON.stringify({ ...feed, items }, null, 2), 'utf8')
    .then(() => console.log('Bookmark JSON saved:', items.length, FILE_NAME))
    .catch(err => console.error('ERROR:', err));
}

// console.debug('Gist list:', remaining, reset, GISTS.data[0]);

async function delay (delayMS = 250) {
  return new Promise(resolve => setTimeout(() => resolve(), delayMS));
}

/* End. */
