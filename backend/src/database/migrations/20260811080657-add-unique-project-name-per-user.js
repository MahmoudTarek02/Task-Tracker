"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex("projects", ["userId", "name"], {
      unique: true,
      name: "projects_user_id_name_unique",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      "projects",
      "projects_user_id_name_unique"
    );
  },
};