const { request, gql } = require('graphql-request');

/**
 * GraphQL client with query builder
 */
class GraphQLClient {
  constructor(config) {
    this.endpoint = config.endpoint;
    this.headers = config.headers || {};
    this.wsEndpoint = config.wsEndpoint;
  }
  
  /**
   * Execute a GraphQL query
   */
  async query(queryString, variables = {}) {
    return this.execute(queryString, variables);
  }
  
  /**
   * Execute a GraphQL mutation
   */
  async mutation(mutationString, variables = {}) {
    return this.execute(mutationString, variables);
  }
  
  /**
   * Execute GraphQL operation
   */
  async execute(operation, variables = {}) {
    const response = await request({
      url: this.endpoint,
      document: gql(operation),
      variables,
      requestHeaders: this.headers
    });
    
    return response;
  }
  
  /**
   * Set authorization header
   */
  setAuth(token) {
    this.headers['Authorization'] = `Bearer ${token}`;
  }
  
  /**
   * Set custom header
   */
  setHeader(key, value) {
    this.headers[key] = value;
  }
}

/**
 * GraphQL query builder for programmatic query construction
 */
class QueryBuilder {
  constructor() {
    this.reset();
  }
  
  reset() {
    this._type = 'query';
    this._name = null;
    this._variables = [];
    this._fields = [];
    this._fragments = [];
    return this;
  }
  
  query(name) {
    this._type = 'query';
    this._name = name;
    return this;
  }
  
  mutation(name) {
    this._type = 'mutation';
    this._name = name;
    return this;
  }
  
  subscription(name) {
    this._type = 'subscription';
    this._name = name;
    return this;
  }
  
  variable(name, type, defaultValue) {
    this._variables.push({ name, type, defaultValue });
    return this;
  }
  
  field(name, args, subfields) {
    const field = new Field(name, args);
    if (subfields) {
      subfields(field);
    }
    this._fields.push(field);
    return this;
  }
  
  fragment(name, type, builder) {
    const fragment = new Fragment(name, type);
    builder(fragment);
    this._fragments.push(fragment);
    return this;
  }
  
  build() {
    const parts = [];
    
    // Add fragments
    for (const fragment of this._fragments) {
      parts.push(fragment.toString());
    }
    
    // Build operation
    let operation = this._type;
    if (this._name) {
      operation += ` ${this._name}`;
    }
    
    // Add variables
    if (this._variables.length > 0) {
      const vars = this._variables.map(v => {
        let str = `$${v.name}: ${v.type}`;
        if (v.defaultValue !== undefined) {
          str += ` = ${JSON.stringify(v.defaultValue)}`;
        }
        return str;
      }).join(', ');
      operation += `(${vars})`;
    }
    
    // Add fields
    const fields = this._fields.map(f => f.toString()).join('\n  ');
    operation += ` {\n  ${fields}\n}`;
    
    parts.push(operation);
    
    return parts.join('\n\n');
  }
}

/**
 * GraphQL field representation
 */
class Field {
  constructor(name, args) {
    this.name = name;
    this.args = args || {};
    this.subfields = [];
    this.spreads = [];
  }
  
  field(name, args, subfields) {
    const field = new Field(name, args);
    if (subfields) {
      subfields(field);
    }
    this.subfields.push(field);
    return this;
  }
  
  spread(fragmentName) {
    this.spreads.push(fragmentName);
    return this;
  }
  
  argsToString() {
    const entries = Object.entries(this.args);
    if (entries.length === 0) return '';
    
    const args = entries.map(([key, value]) => {
      if (typeof value === 'string' && value.startsWith('$')) {
        return `${key}: ${value}`;
      }
      return `${key}: ${JSON.stringify(value)}`;
    }).join(', ');
    
    return `(${args})`;
  }
  
  toString(indent = 0) {
    const spaces = '  '.repeat(indent);
    let str = `${spaces}${this.name}${this.argsToString()}`;
    
    if (this.subfields.length > 0 || this.spreads.length > 0) {
      str += ' {';
      
      for (const spread of this.spreads) {
        str += `\n${spaces}  ...${spread}`;
      }
      
      for (const field of this.subfields) {
        str += '\n' + field.toString(indent + 1);
      }
      
      str += `\n${spaces}}`;
    }
    
    return str;
  }
}

/**
 * GraphQL fragment representation
 */
class Fragment {
  constructor(name, type) {
    this.name = name;
    this.type = type;
    this.fields = [];
  }
  
  field(name, args, subfields) {
    const field = new Field(name, args);
    if (subfields) {
      subfields(field);
    }
    this.fields.push(field);
    return this;
  }
  
  toString() {
    const fields = this.fields.map(f => f.toString(1)).join('\n');
    return `fragment ${this.name} on ${this.type} {\n${fields}\n}`;
  }
}

module.exports = { GraphQLClient, QueryBuilder, Field, Fragment };
