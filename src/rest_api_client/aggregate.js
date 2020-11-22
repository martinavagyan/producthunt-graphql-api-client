import { promises as fs } from 'fs';
import { getWorkerName, workerCount } from './config'

const aggregate = async () => {
  console.info('Collect from all workers');
  let rawAggregate = [];
  try {
    for(let i = 0; i < workerCount; i++) {
      const data = await fs.readFile(getWorkerName(i), 'utf8');
      const oldData = JSON.parse(data);
      rawAggregate = oldData.concat(rawAggregate);
    }
    console.info('Raw aggregates: ', rawAggregate.length);
    fs.writeFile('ph_posts.json',  JSON.stringify(rawAggregate), 'utf8', (e) => e ? console.error(e) : console.info('posts saved'));
  } catch(e) {
    console.error('Failed fetching data, setting aggregate to empty');
    rawAggregate = [];
  }
}
aggregate();

