const { gql } = require('graphql-tag');

const typeDefs = gql`
  enum NiveauAlerte {
    info
    warning
    critique
  }

  type Alerte {
    id: ID!
    type: String!
    niveau: NiveauAlerte!
    vehiculeId: ID
    message: String!
    lu: Boolean!
    createdAt: String
    updatedAt: String
  }

  extend type Query {
    alertes(niveau: NiveauAlerte, lu: Boolean, vehiculeId: ID): [Alerte!]!
    alerte(id: ID!): Alerte
  }

  extend type Mutation {
    marquerAlerteLue(id: ID!): Alerte!
  }
`;

module.exports = typeDefs;
