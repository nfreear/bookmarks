/**
 * Fetch, read and parse Gists, and write a JSON bookmarks file.
 *
 * @copyright © Nick Freear, 06-Dec-2022.
 * @see https://octokit.github.io/rest.js/v19#gists-list-for-user
 */

import { Octokit } from '@octokit/rest';
import * as dotenv from 'dotenv';
import { promises as fs } from 'fs';

dotenv.config();

const {
  GH_AUTH, GH_USERNAME, PER_PAGE, BOOKMARK_FILE, FEED_TITLE, FEED_LINK
} = process.env;

const auth = GH_AUTH || null;
const userAgent = 'nfreear/bookmarks 0.9';
const username = GH_USERNAME || 'nick-test-14';
const per_page = parseInt(PER_PAGE) || 5; /* eslint-disable-line camelcase */
const FILE_NAME = BOOKMARK_FILE || './docs/bookmarks.json';

const title = FEED_TITLE || 'My Bookmarks';
const link = FEED_LINK || null;

console.debug('PER_PAGE:', PER_PAGE);

(async () => {
  const ITEMS = await fetchGists();

  writeBookmarksJson(ITEMS);
})();

async function fetchGists () {
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

    return { ...bookmark, id };
  });

  return await Promise.all(allItems);
}

function writeBookmarksJson (items) {
  const time = new Date().toISOString();
  const feed = { title, link, time, per_page };

  fs.writeFile(FILE_NAME, JSON.stringify({ feed, items }, null, 2), 'utf8')
    .then(() => console.log('Bookmark JSON saved:', items.length, FILE_NAME))
    .catch(err => console.error('ERROR:', err));
}

// console.debug('Gist list:', remaining, reset, GISTS.data[0]);

async function delay (delayMS = 250) {
  return new Promise(resolve => setTimeout(() => resolve(), delayMS));
}

/* End. */
