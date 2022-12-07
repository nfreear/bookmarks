/**
 * Fetch Gists, parse and write a bookmarks JSON file.
 *
 * @copyright NDF, 06-Dec-2022.
 */

import { Octokit } from '@octokit/rest';
import * as dotenv from 'dotenv';
import { promises as fs } from 'fs';

dotenv.config();

const { GH_AUTH, GH_USERNAME, PER_PAGE, BOOKMARK_FILE } = process.env;

const auth = GH_AUTH || null;
const userAgent = 'nfreear/bookmarks 0.9';
const username = GH_USERNAME || 'nick-test-14';
const per_page = PER_PAGE || 5;
const FILE_NAME = BOOKMARK_FILE || './docs/bookmarks.json';

console.debug('PER_PAGE:', PER_PAGE);

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

  console.debug('Gist:', remaining, reset, description, id);
  // console.debug('>>', data);
  // console.debug('>>', language, bookmark);

  await delay();

  return bookmark;
});

const items = await Promise.all(allItems);
const date = new Date().toISOString();

fs.writeFile(FILE_NAME, JSON.stringify({ date, items }, null, 2), 'utf8')
  .then(() => console.log('Bookmark JSON saved:', items.length, FILE_NAME))
  .catch(err => console.error('ERROR:', err));

// console.debug('Gist list:', remaining, reset, GISTS.data[0]);

async function delay (delayMS = 250) {
  return new Promise(resolve => setTimeout(() => resolve(), delayMS));
}

/* End. */
