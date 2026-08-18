import { Project } from "../../database/models";
import { UniqueConstraintError, Sequelize } from "sequelize"; 

class ProjectService {
  async createProject(
    userId: string,
    name: string,
    description?: string | null
  ) {
    const existing = await Project.findOne({
      where: { userId, name },
    });

    if (existing) {
      throw new Error("A project with this name already exists.");
    }

    // The database now enforces UNIQUE(userId, name) to prevent duplicate
    // projects even when concurrent requests bypass the findOne() check.
    try {
      const project = await Project.create({
        name,
        description,
        userId,
      });

      return project;
    } catch (error) {
      // Handle a duplicate detected by the database-level unique constraint.
      // This protects against race conditions between findOne() and create().
      if (error instanceof UniqueConstraintError) {
        throw new Error("A project with this name already exists.");
      }

      throw error;
    }
  }

  async getProjectsByUser(userId: string) {
    const projects = await Project.findAll({
      where: { userId },
      attributes: {
        include: [
          [
            // Design Approaches Comparison:
            // -----------------------------
            // Approach A: Dynamic/Calculated Query (Selected)
            // - Calculates project overdue status dynamically on every fetch via database subquery.
            // - Always real-time accurate; no sync bugs, no static column overhead, no DB migrations.
            //
            // Approach B: Stored Boolean Flag in Database
            // - Stores overdue status as a static column in the 'projects' table.
            // - Requires data migrations and complex triggers/hooks to prevent time-drift desynchronization.
            Sequelize.literal(`
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
      order: [["createdAt", "DESC"]],
    });

    return projects;
  }

  async getProjectByIdAndUser(projectId: string, userId: string) {
    const project = await Project.findOne({
      where: { id: projectId, userId },
    });

    return project;
  }

  async updateProject(
    projectId: string,
    userId: string,
    updateData: {
      name?: string | undefined;
      description?: string | null | undefined;
    }
  ) {
    const project = await this.getProjectByIdAndUser(projectId, userId);

    if (!project) {
      throw new Error("Project not found or access denied.");
    }

    if (
      updateData.name &&
      updateData.name !== project.getDataValue("name")
    ) {
      const existing = await Project.findOne({
        where: {
          userId,
          name: updateData.name,
        },
      });

      if (existing) {
        throw new Error("A project with this name already exists.");
      }
    }

    // The database-level unique constraint also applies to updates,
    // so catch violations caused by concurrent update requests.
    try {
      await project.update(updateData);
      return project;
    } catch (error) {
      // Convert the database unique constraint violation into
      // the same application-level duplicate-name error.
      if (error instanceof UniqueConstraintError) {
        throw new Error("A project with this name already exists.");
      }

      throw error;
    }
  }

  async deleteProject(projectId: string, userId: string) {
    const project = await this.getProjectByIdAndUser(projectId, userId);

    if (!project) {
      throw new Error("Project not found or access denied.");
    }

    await project.destroy();

    return {
      message: "Project deleted successfully",
    };
  }
}

export default new ProjectService();