const { GraphQLClient, QueryBuilder } = require('../graphql/graphql-client');

/**
 * Example: GraphQL Client Usage
 * 
 * This example demonstrates how to use the GraphQL client
 * and query builder.
 */

/**
 * Example 1: Basic GraphQL Queries
 */
async function basicGraphQLExample() {
  const client = new GraphQLClient({
    endpoint: 'https://api.github.com/graphql',
    headers: {
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`
    }
  });
  
  // Simple query
  const query = `
    query GetUser($login: String!) {
      user(login: $login) {
        id
        name
        email
        bio
        followers {
          totalCount
        }
        repositories(first: 10) {
          nodes {
            name
            description
            stargazerCount
          }
        }
      }
    }
  `;
  
  const result = await client.query(query, { login: 'octocat' });
  console.log('User:', result.user);
}

/**
 * Example 2: Using Query Builder
 */
async function queryBuilderExample() {
  const qb = new QueryBuilder();
  
  // Build a query programmatically
  const query = qb
    .query('GetRepository')
    .variable('owner', 'String!')
    .variable('name', 'String!')
    .field('repository', { owner: '$owner', name: '$name' }, (repo) => {
      repo
        .field('id')
        .field('name')
        .field('description')
        .field('url')
        .field('stargazerCount')
        .field('forkCount')
        .field('issues', { states: 'OPEN', first: 10 }, (issues) => {
          issues.field('totalCount');
          issues.field('nodes', {}, (node) => {
            node
              .field('id')
              .field('title')
              .field('createdAt');
          });
        });
    })
    .build();
  
  console.log('Generated Query:');
  console.log(query);
  
  // Execute the query
  const client = new GraphQLClient({
    endpoint: 'https://api.github.com/graphql',
    headers: {
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`
    }
  });
  
  const result = await client.query(query, { owner: 'facebook', name: 'react' });
  console.log('Repository:', result.repository);
}

/**
 * Example 3: Using Fragments
 */
async function fragmentsExample() {
  const qb = new QueryBuilder();
  
  // Define a fragment
  const userFragment = qb.fragment('UserFields', 'User', (f) => {
    f.field('id')
     .field('login')
     .field('name')
     .field('email')
     .field('avatarUrl', { size: 200 });
  });
  
  // Use the fragment in a query
  const query = qb
    .query('GetIssueWithAuthor')
    .variable('id', 'ID!')
    .fragment(userFragment)
    .field('node', { id: '$id' }, (node) => {
      node.field('... on Issue', {}, (issue) => {
        issue
          .field('id')
          .field('title')
          .field('body')
          .field('author', {}, (author) => {
            author.spread('UserFields');
          });
      });
    })
    .build();
  
  console.log('Query with fragments:');
  console.log(query);
}

/**
 * Example 4: Mutations
 */
async function mutationExample() {
  const client = new GraphQLClient({
    endpoint: 'https://api.example.com/graphql',
    headers: {
      'Authorization': `Bearer ${process.env.API_TOKEN}`
    }
  });
  
  const mutation = `
    mutation CreatePost($input: CreatePostInput!) {
      createPost(input: $input) {
        post {
          id
          title
          content
          publishedAt
        }
        errors {
          field
          message
        }
      }
    }
  `;
  
  const result = await client.mutation(mutation, {
    input: {
      title: 'My New Post',
      content: 'This is the content of my post.',
      published: true
    }
  });
  
  console.log('Created post:', result.createPost.post);
}

/**
 * Example 5: Error Handling
 */
async function errorHandlingExample() {
  const client = new GraphQLClient({
    endpoint: 'https://api.github.com/graphql',
    headers: {
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`
    }
  });
  
  try {
    const result = await client.query(`
      query {
        viewer {
          login
        }
      }
    `);
    console.log('Result:', result);
  } catch (error) {
    if (error.response?.errors) {
      // GraphQL errors (returned with 200 status)
      console.error('GraphQL Errors:');
      error.response.errors.forEach(err => {
        console.error(`  - ${err.message}`);
        if (err.path) {
          console.error(`    Path: ${err.path.join('.')}`);
        }
      });
    } else {
      // HTTP errors
      console.error('Request failed:', error.message);
    }
  }
}

/**
 * Example 6: Complex Query with Multiple Fields
 */
async function complexQueryExample() {
  const qb = new QueryBuilder();
  
  const query = qb
    .query('SearchRepositories')
    .variable('query', 'String!')
    .variable('first', 'Int', 10)
    .field('search', { query: '$query', type: 'REPOSITORY', first: '$first' }, (search) => {
      search
        .field('repositoryCount')
        .field('edges', {}, (edge) => {
          edge.field('node', {}, (node) => {
            node.field('... on Repository', {}, (repo) => {
              repo
                .field('id')
                .field('name')
                .field('owner', {}, (owner) => {
                  owner.field('login');
                })
                .field('description')
                .field('stargazerCount')
                .field('primaryLanguage', {}, (lang) => {
                  lang.field('name').field('color');
                });
            });
          });
        });
    })
    .build();
  
  const client = new GraphQLClient({
    endpoint: 'https://api.github.com/graphql',
    headers: {
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`
    }
  });
  
  const result = await client.query(query, { 
    query: 'language:typescript stars:>1000',
    first: 5 
  });
  
  console.log('Found repositories:', result.search.repositoryCount);
  result.search.edges.forEach(edge => {
    console.log(`- ${edge.node.owner.login}/${edge.node.name}: ${edge.node.stargazerCount} stars`);
  });
}

// Run examples if this file is executed directly
if (require.main === module) {
  basicGraphQLExample().catch(console.error);
}

module.exports = {
  basicGraphQLExample,
  queryBuilderExample,
  fragmentsExample,
  mutationExample,
  errorHandlingExample,
  complexQueryExample
};
