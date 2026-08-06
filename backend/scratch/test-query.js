"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../src/database/models");
const sequelize_1 = require("sequelize");
async function test() {
    try {
        const projects = await models_1.Project.findAll({
            where: { userId: "some-uuid" },
            attributes: {
                include: [
                    [
                        sequelize_1.Sequelize.literal(`
              EXISTS (
                SELECT 1 FROM "tasks" AS t
                WHERE t."projectId" = "Project".id
                  AND t."dueDate" < NOW()
                  AND t.status != 'Done'
              )
            `),
                        "hasOverdueTasks",
                    ],
                ],
            },
        });
        console.log("Success:", projects);
    }
    catch (err) {
        console.error("Error:", err.message);
    }
}
test();
//# sourceMappingURL=test-query.js.map