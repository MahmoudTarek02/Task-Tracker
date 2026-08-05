import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import TaskBoard from "../components/TaskBoard";
import api from "../services/api";

interface Project {
  id: string;
  name: string;
  description?: string;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      const response = await api.get("/projects");
      const fetchedProjects = response.data.projects || [];
      setProjects(fetchedProjects);
    } catch (err: any) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleProjectCreated = (newProj: Project) => {
    setProjects((prev) => [newProj, ...prev]);
    setSelectedProjectId(newProj.id);
  };

  const activeProject = projects.find((p) => p.id === selectedProjectId) || null;

  const handleDeleteProject = async () => {
    if (!activeProject) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the project "${activeProject.name}"? All tasks inside will be permanently deleted.`
    );
    if (!confirmDelete) return;

    try {
      await api.delete(`/projects/${activeProject.id}`);
      const updated = projects.filter((p) => p.id !== activeProject.id);
      setProjects(updated);
      // Select another project if available, otherwise select null
      if (updated.length > 0) {
        setSelectedProjectId(updated[0].id);
      } else {
        setSelectedProjectId(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete project.");
    }
  };

  const handleOpenEditModal = () => {
    if (!activeProject) return;
    setEditName(activeProject.name);
    setEditDesc(activeProject.description || "");
    setEditError(null);
    setShowEditModal(true);
  };

  const handleEditProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !editName.trim()) return;
    setEditError(null);

    try {
      const response = await api.put(`/projects/${activeProject.id}`, {
        name: editName.trim(),
        description: editDesc.trim() || null,
      });
      const updatedProj = response.data.project;
      setProjects((prev) =>
        prev.map((p) => (p.id === updatedProj.id ? updatedProj : p))
      );
      setShowEditModal(false);
    } catch (err: any) {
      setEditError(err.response?.data?.message || "Failed to update project.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw", overflow: "hidden" }}>
      <Navbar />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar
          projects={projects}
          loading={loading}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
          onProjectCreated={handleProjectCreated}
        />
        <main style={{ flex: 1, padding: "24px", overflowY: "auto", backgroundColor: "#fff" }}>
          {activeProject ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "15px" }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: "1.8rem", color: "#333" }}>{activeProject.name}</h1>
                  {activeProject.description && (
                    <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "0.95rem" }}>{activeProject.description}</p>
                  )}
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={handleOpenEditModal}
                    style={{
                      padding: "8px 14px",
                      backgroundColor: "#fff",
                      color: "#0052cc",
                      border: "1px solid #0052cc",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      fontWeight: "bold",
                      transition: "background 0.2s"
                    }}
                  >
                    Edit Project
                  </button>
                  <button
                    onClick={handleDeleteProject}
                    style={{
                      padding: "8px 14px",
                      backgroundColor: "#fff",
                      color: "#dc3545",
                      border: "1px solid #dc3545",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      fontWeight: "bold",
                      transition: "background 0.2s"
                    }}
                  >
                    Delete Project
                  </button>
                </div>
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <TaskBoard projectId={activeProject.id} />
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "#888", fontStyle: "italic", fontSize: "1.1rem" }}>
              Please select or create a project to get started.
            </div>
          )}
        </main>
      </div>

      {showEditModal && activeProject && (
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
            <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#333" }}>Edit Project</h3>
            <form onSubmit={handleEditProjectSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#666" }}>Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Project name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
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
                  placeholder="Project description..."
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
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
              {editError && <span style={{ color: "#dc3545", fontSize: "0.85rem" }}>{editError}</span>}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button 
                  type="button" 
                  onClick={() => { setShowEditModal(false); setEditError(null); }}
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
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
