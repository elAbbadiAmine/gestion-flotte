const { gql } = require('graphql-tag');
const typeDefs = gql`
  type Position {
    time: String!
    vehiculeId: String!
    latitude: Float!
    longitude: Float!
  }
  extend type Query {
    historiquePositions(vehiculeId: ID!, debut: String, fin: String): [Position!]!
    dernierePosition(vehiculeId: ID!): Position
  }
`;
module.exports = typeDefs;
