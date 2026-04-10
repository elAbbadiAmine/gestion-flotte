const { gql } = require('graphql-tag');
const typeDefs = gql`
  enum StatutConducteur {
    actif
    inactif
    en_mission
    suspendu
  }
  type Conducteur {
    id: ID!
    nom: String!
    prenom: String!
    email: String!
    telephone: String!
    numeroPermis: String!
    categoriesPermis: [String!]!
    dateExpirationPermis: String!
    statut: StatutConducteur!
    createdAt: String
    updatedAt: String
  }
  input CreateConducteurInput {
    nom: String!
    prenom: String!
    email: String!
    telephone: String!
    numeroPermis: String!
    categoriesPermis: [String!]
    dateExpirationPermis: String!
    statut: StatutConducteur
  }
  input UpdateConducteurInput {
    nom: String
    prenom: String
    email: String
    telephone: String
    numeroPermis: String
    categoriesPermis: [String!]
    dateExpirationPermis: String
    statut: StatutConducteur
  }
  extend type Query {
    conducteurs: [Conducteur!]!
    conducteur(id: ID!): Conducteur
  }
  extend type Mutation {
    createConducteur(input: CreateConducteurInput!): Conducteur!
    updateConducteur(id: ID!, input: UpdateConducteurInput!): Conducteur!
    deleteConducteur(id: ID!): Boolean!
  }
`;
module.exports = typeDefs;
