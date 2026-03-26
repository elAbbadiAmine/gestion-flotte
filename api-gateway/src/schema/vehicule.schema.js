const { gql } = require('graphql-tag');

const typeDefs = gql`
  enum StatutVehicule {
    disponible
    en_mission
    en_maintenance
    hors_service
  }

  type Vehicule {
    id: ID!
    immatriculation: String!
    marque: String!
    modele: String!
    annee: Int!
    statut: StatutVehicule!
    kilometrage: Int!
    createdAt: String
    updatedAt: String
  }

  input CreateVehiculeInput {
    immatriculation: String!
    marque: String!
    modele: String!
    annee: Int!
    statut: StatutVehicule
    kilometrage: Int
  }

  input UpdateVehiculeInput {
    immatriculation: String
    marque: String
    modele: String
    annee: Int
    statut: StatutVehicule
    kilometrage: Int
  }

  type Query {
    vehicules(statut: StatutVehicule): [Vehicule!]!
    vehicule(id: ID!): Vehicule
  }

  type Mutation {
    createVehicule(input: CreateVehiculeInput!): Vehicule!
    updateVehicule(id: ID!, input: UpdateVehiculeInput!): Vehicule!
    deleteVehicule(id: ID!): Boolean!
  }
`;

module.exports = typeDefs;