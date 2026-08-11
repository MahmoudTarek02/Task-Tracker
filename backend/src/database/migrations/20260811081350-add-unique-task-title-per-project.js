"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex("tasks", ["projectId", "title"], {
      unique: true,
      name: "tasks_project_id_title_unique",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      "tasks",
      "tasks_project_id_title_unique"
    );
  },
};