const { gql } = require('graphql-tag');
const typeDefs = gql`
  enum TypeIntervention {
    revision
    reparation
    controle_technique
    pneus
    autre
  }
  enum StatutIntervention {
    planifiee
    en_cours
    terminee
    annulee
  }
  type Maintenance {
    id: ID!
    vehiculeId: ID!
    type: TypeIntervention!
    statut: StatutIntervention!
    datePlanifiee: String!
    dateReelle: String
    kilometrageIntervention: Int
    kilometrageProchaine: Int
    description: String
    cout: Float
    technicien: String
    createdAt: String
    updatedAt: String
  }
  input CreateMaintenanceInput {
    vehiculeId: ID!
    type: TypeIntervention!
    datePlanifiee: String!
    description: String
    technicien: String
  }
  input UpdateMaintenanceInput {
    type: TypeIntervention
    statut: StatutIntervention
    datePlanifiee: String
    dateReelle: String
    kilometrageIntervention: Int
    kilometrageProchaine: Int
    description: String
    cout: Float
    technicien: String
  }
  extend type Query {
    maintenances: [Maintenance!]!
    maintenance(id: ID!): Maintenance
  }
  extend type Mutation {
    createMaintenance(input: CreateMaintenanceInput!): Maintenance!
    updateMaintenance(id: ID!, input: UpdateMaintenanceInput!): Maintenance!
  }
`;
module.exports = typeDefs;
