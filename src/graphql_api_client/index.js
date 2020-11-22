import 'dotenv/config';
import 'cross-fetch/polyfill';
import ApolloClient, {
  gql
} from 'apollo-boost';

import fs from 'fs';

const client = new ApolloClient({
  uri: 'https://api.producthunt.com/v2/api/graphql',
  request: operation => {
    operation.setContext({
      headers: {
        authorization: `Bearer ${process.env.PH_API_KEY}`,
      },
    });
  },
});

const GET_POSTS = gql `
  query($postedAfterDate: DateTime!, $cursor: String) {
      posts(postedAfter: $postedAfterDate, after: $cursor, first: 20) {
        totalCount
        edges {
          node {
            topics {
              edges {
                node {
                  name
                }
              }
            }
            name
            description
            createdAt
            reviewsRating
          }
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
`;


const saveFile = (name, data) => {
  fs.writeFile(name, JSON.stringify(data), 'utf8', (e) => e ? error(e) : console.log('Failed to save'));
}

const getPosts = async () => {
  const GET_POSTS_VAR = {
    postedAfterDate: "2013-12-1",
    cursor: undefined
  };
  const result = await client.query({ query: GET_POSTS, variables: GET_POSTS_VAR});
  console.log('Successfully retrieved');
  console.log(result);
  saveFile('posts.json', result);
}

getPosts();