/**
 * Fetch Gists, parse and write a bookmarks JSON file.
 *
 * @copyright NDF, 06-Dec-2022.
 */

import { Octokit } from '@octokit/rest';
import { promises as fs } from 'fs';

const auth = null;
const userAgent = 'ndf/bookmarks 0.9';
const username = 'nick-test-14';
const per_page = 5;
const FILE_NAME = './docs/bookmarks.json';

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
  .then(() => console.log('JSON saved:', items.length))
  .catch(err => console.error('ERROR:', err));

// console.debug('Gist list:', remaining, reset, GISTS.data[0]);

async function delay (delayMS = 250) {
  return new Promise(resolve => setTimeout(() => resolve(), delayMS));
}

/* End. */
