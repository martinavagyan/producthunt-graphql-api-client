import 'dotenv/config';
import 'cross-fetch/polyfill';
import ApolloClient, {
  gql
} from 'apollo-boost';

const client = new ApolloClient({
  uri: 'https://api.producthunt.com/v2/api/graphql',
  request: operation => {
    operation.setContext({
      headers: {
        authorization: `Bearer ${process.env.PRODUCT_HUNT_API_KEY}`,
      },
    });
  },
});

const GET_POSTS = gql `
  {
    posts(postedAfter: "2020-09-10") {
      totalCount
      pageInfo {
        endCursor
      }
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
    }
  }
`;
client
  .query({
    query: GET_POSTS
  })
  .then(result => console.log(result));