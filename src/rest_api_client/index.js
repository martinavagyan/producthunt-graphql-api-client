import axios from 'axios';
import fs from 'fs';
import 'dotenv/config';
import { workerCount, getWorkerName } from './config';

const BASE_URL = 'https://api.producthunt.com/v1/posts/all';
const pageSize = 50;
const startPage = 1001;
const endPage = 1578;

// Worker config
const workerStartIndex = {}


const initializeWorkerStartIndex = () => {
  console.info(workerCount + ' workers are initialing');
  for(let i = 0; i < workerCount; i++) {
    workerStartIndex[i] = i + startPage;
  }
}
initializeWorkerStartIndex();

const initializeWorkerFiles = async () => {
  console.info(workerCount + ' worker files are being created');
  for(let i = 0; i < workerCount; i++) {
    await fs.writeFile(getWorkerName(i),  JSON.stringify([]), 'utf8', (e) => e ? console.error(e) : console.info(getWorkerName(i)+ ' file initialized'));
  }
}
initializeWorkerFiles();

// get api keys
const API_TOKENS = [];
const getApiKeys = () => {
  let i = 0;
  let key = process.env[`PH_API_KEY_${i}`];
  while(key !== undefined) {
    API_TOKENS.push(key);
    key = process.env[`PH_API_KEY_${++i}`];
  }
  console.info('Found: '+ API_TOKENS.length+' keys');
}
getApiKeys();

let tokenId = 0;
const getNextToken = () => {
  const token = API_TOKENS[tokenId];
  tokenId = (tokenId + 1) % API_TOKENS.length;
  return token;
}

export const fetch = async url => {
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: 'Bearer ' + getNextToken(),
        'Content-Type': 'application/json',
      }
    });
    const data = response.data;
    if (response.status == 200) {
      return data;
    } else if (data.status == 429) {
      console.log('Limit hit');
      return null;
    } else {
      console.log('Status code error: ', data.status.message);
    }
  } catch(e) {
    console.log('Request failed: ', e.message);
  }
}

// set up workers
const getPosts = () => {
  for(let i = 0; i < workerCount; i++) {
    workerFetcher(i);
  }
}

const workerFetcher = async idx => {
  const name = getWorkerName(idx);
  let i = 0;
  let items = [];
  try {
    for(i = workerStartIndex[idx]; i < endPage; i+=workerCount) {
      const url = `${BASE_URL}?page=${i}}`
      console.info(`${name} is fetching: ${url}`);
      const data = await fetch(url);
      if(data === null) {
        break;
      }
      const {posts} = data;
      if(!posts || posts.length === 0) {
        console.log(`Worker ${idx} is done.`);
        break;
      } else {
        items = items.concat(posts);
      }
    }
  } catch(e) {
    console.error(e);
    console.info('---------');
  } finally {
    console.error('Worker: ', idx, ' Stopped at: ', i);
    console.info('Processed: ', items.length);
    workerStartIndex[idx] = i;
    fs.readFile(name, 'utf8', (err, data) => {
      const oldData = JSON.parse(data);
      let finalData = oldData.concat(items);
      fs.writeFile(name,  JSON.stringify(finalData), 'utf8', (e) => e ? console.error(e) : console.info('Items saved'));
    });
  }
}

getPosts();
