'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Tx extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Tx.init({
    network: DataTypes.STRING,
    tx_hash: DataTypes.STRING,
    from: DataTypes.STRING,
    to: DataTypes.STRING,
    value: DataTypes.STRING,
    block: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Tx',
  });
  return Tx;
};