import { useState } from "react";
import api from "../services/api";

interface Project {
  id: string;
  name: string;
  description?: string;
  hasOverdueTasks?: boolean;
}

interface SidebarProps {
  projects: Project[];
  loading: boolean;
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onProjectCreated: (newProj: Project) => void;
}

export default function Sidebar({
  projects,
  loading,
  selectedProjectId,
  onSelectProject,
  onProjectCreated,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!newProjectName.trim()) return;

    try {
      const response = await api.post("/projects", {
        name: newProjectName.trim(),
        description: newProjectDesc.trim() || null,
      });
      const newProj = response.data.project;
      onProjectCreated(newProj);
      setNewProjectName("");
      setNewProjectDesc("");
      setShowModal(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create project.");
    }
  };

  return (
    <aside style={{
      width: "250px",
      backgroundColor: "#f4f5f7",
      borderRight: "1px solid #ddd",
      padding: "20px 15px",
      display: "flex",
      flexDirection: "column",
      gap: "20px",
      boxSizing: "border-box",
      height: "calc(100vh - 60px)",
      overflowY: "auto"
    }}>
      <div
        style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", userSelect: "none" }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <span style={{ fontSize: "0.8rem", color: "#666", display: "inline-block", width: "12px" }}>
          {isCollapsed ? "▶" : "▼"}
        </span>
        <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#333" }}>Projects</h3>
      </div>

      <button
        onClick={() => { setShowModal(true); setError(null); }}
        style={{
          width: "100%",
          padding: "8px 12px",
          backgroundColor: "#0052cc",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "0.9rem",
          fontWeight: "bold",
          transition: "background 0.2s"
        }}
      >
        Create Project
      </button>

      {!isCollapsed && (
        <>
          {loading ? (
            <div style={{ fontSize: "0.9rem", color: "#666" }}>Loading projects...</div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "5px" }}>
              {projects.length === 0 ? (
                <li style={{ fontSize: "0.9rem", color: "#888", fontStyle: "italic" }}>No projects found.</li>
              ) : (
                projects.map((proj) => {
                  const isSelected = proj.id === selectedProjectId;
                  return (
                    <li
                      key={proj.id}
                      onClick={() => onSelectProject(proj.id)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "4px",
                        borderLeft: proj.hasOverdueTasks ? "4px solid #dc3545" : "none",
                        cursor: "pointer",
                        backgroundColor: isSelected ? "#deebff" : "transparent",
                        color: isSelected ? "#0747a6" : "#333",
                        fontWeight: isSelected ? "bold" : "normal",
                        fontSize: "0.95rem",
                        transition: "background 0.2s",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <span>{proj.name}</span>
                      {proj.hasOverdueTasks && (
                        <span
                          title="This project has overdue tasks"
                          style={{
                            color: "#dc3545",
                            fontWeight: "bold",
                            fontSize: "1rem"
                          }}
                        >
                          ⚠️
                        </span>
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          )}
        </>
      )}

      {showModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "#fff",
            padding: "24px",
            borderRadius: "8px",
            width: "400px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            boxSizing: "border-box"
          }}>
            <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#333" }}>Create New Project</h3>
            <form onSubmit={handleCreateProject} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#666" }}>Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My Next Big Idea"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  style={{
                    padding: "8px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    fontSize: "0.95rem",
                    color: "#333",
                    backgroundColor: "#fff"
                  }}
                  autoFocus
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#666" }}>Description</label>
                <textarea
                  placeholder="What is this project about?"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  style={{
                    padding: "8px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    fontSize: "0.95rem",
                    minHeight: "80px",
                    resize: "vertical",
                    fontFamily: "inherit",
                    color: "#333",
                    backgroundColor: "#fff"
                  }}
                />
              </div>
              {error && <span style={{ color: "#dc3545", fontSize: "0.85rem" }}>{error}</span>}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setError(null); }}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#fff",
                    color: "#333",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.9rem"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#0052cc",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.9rem"
                  }}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
