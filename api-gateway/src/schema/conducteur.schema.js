const { gql } = require('graphql-tag');
const typeDefs = gql`
  enum StatutConducteur {
    actif
    inactif
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
    vehiculeId: ID
    missionDebutAt: String
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
    conducteurs(statut: StatutConducteur): [Conducteur!]!
    conducteur(id: ID!): Conducteur
  }
  extend type Mutation {
    createConducteur(input: CreateConducteurInput!): Conducteur!
    updateConducteur(id: ID!, input: UpdateConducteurInput!): Conducteur!
    deleteConducteur(id: ID!): Boolean!
    assignerMission(id: ID!, vehiculeId: ID!, missionId: String!): Boolean!
    terminerMission(id: ID!, missionId: String!): Boolean!
  }
`;
module.exports = typeDefs;
