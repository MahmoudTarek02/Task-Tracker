import { useEffect, useState } from "react";
import api from "../services/api";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: "To Do" | "In Progress" | "Done";
  priority: "Low" | "Medium" | "High";
  estimatedTime?: number;
  dueDate?: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

interface TaskBoardProps {
  projectId: string;
}

export default function TaskBoard({ projectId }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null); // null if creating, task if editing

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"To Do" | "In Progress" | "Done">("To Do");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [estimatedTime, setEstimatedTime] = useState<number | "">("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/tasks?projectId=${projectId}`);
      setTasks(response.data.tasks || []);
    } catch (err: any) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const handleOpenCreateModal = (colStatus: "To Do" | "In Progress" | "Done") => {
    setActiveTask(null);
    setTitle("");
    setDescription("");
    setStatus(colStatus);
    setPriority("Medium");
    setEstimatedTime("");
    setDueDate("");
    setError(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setActiveTask(task);
    setTitle(task.title);
    setDescription(task.description || "");
    setStatus(task.status);
    setPriority(task.priority);
    setEstimatedTime(task.estimatedTime !== undefined && task.estimatedTime !== null ? task.estimatedTime : "");
    setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
    setError(null);
    setShowModal(true);
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      status,
      priority,
      estimatedTime: estimatedTime === "" ? null : Number(estimatedTime),
      dueDate: dueDate || null,
      projectId,
    };

    try {
      if (activeTask) {
        // Edit mode
        const response = await api.put(`/tasks/${activeTask.id}`, payload);
        setTasks((prev) =>
          prev.map((t) => (t.id === activeTask.id ? response.data.task : t))
        );
      } else {
        // Create mode
        const response = await api.post("/tasks", payload);
        setTasks((prev) => [...prev, response.data.task]);
      }
      setShowModal(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save task.");
    }
  };

  const handleQuickStatusChange = async (task: Task, newStatus: "To Do" | "In Progress" | "Done") => {
    try {
      const response = await api.put(`/tasks/${task.id}`, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? response.data.task : t))
      );
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update task status.");
    }
  };

  const handleDeleteTask = async () => {
    if (!activeTask) return;
    const confirmDelete = window.confirm("Are you sure you want to delete this task?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/tasks/${activeTask.id}`);
      setTasks((prev) => prev.filter((t) => t.id !== activeTask.id));
      setShowModal(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete task.");
    }
  };

  const columns: { title: "To Do" | "In Progress" | "Done"; color: string }[] = [
    { title: "To Do", color: "#f4f5f7" },
    { title: "In Progress", color: "#eae6ff" },
    { title: "Done", color: "#e3fcef" },
  ];

  const getPriorityBadgeStyles = (taskPriority: string) => {
    switch (taskPriority) {
      case "High":
        return { backgroundColor: "#ffebe6", color: "#bf2600" };
      case "Medium":
        return { backgroundColor: "#fffae6", color: "#006644" };
      case "Low":
      default:
        return { backgroundColor: "#deebff", color: "#0747a6" };
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", height: "100%" }}>
      {loading ? (
        <div style={{ fontSize: "1.1rem", color: "#666" }}>Loading tasks...</div>
      ) : (
        <div style={{ display: "flex", gap: "20px", flex: 1, height: "100%", minHeight: "500px" }}>
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.title);
            return (
              <div
                key={col.title}
                style={{
                  flex: 1,
                  backgroundColor: "#f4f5f7",
                  borderRadius: "6px",
                  padding: "15px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "15px",
                  boxSizing: "border-box"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: "1rem", color: "#333" }}>
                    {col.title} <span style={{ color: "#777", fontWeight: "normal", fontSize: "0.9rem" }}>({colTasks.length})</span>
                  </h3>
                  <button
                    onClick={() => handleOpenCreateModal(col.title)}
                    style={{
                      backgroundColor: "transparent",
                      border: "none",
                      color: "#0052cc",
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                      cursor: "pointer",
                      padding: "0 5px"
                    }}
                    title="Add task to this column"
                  >
                    +
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1, overflowY: "auto" }}>
                  {colTasks.length === 0 ? (
                    <div style={{ fontSize: "0.85rem", color: "#888", fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>
                      No tasks in this column.
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const badge = getPriorityBadgeStyles(task.priority);
                      return (
                        <div
                          key={task.id}
                          style={{
                            backgroundColor: "#fff",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            padding: "12px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            cursor: "pointer",
                            transition: "box-shadow 0.2s"
                          }}
                          onClick={() => handleOpenEditModal(task)}
                          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 3px 6px rgba(0,0,0,0.1)")}
                          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)")}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                            <span style={{ fontWeight: "bold", fontSize: "0.95rem", color: "#333", wordBreak: "break-word" }}>
                              {task.title}
                            </span>
                            <span style={{
                              padding: "2px 6px",
                              borderRadius: "3px",
                              fontSize: "0.75rem",
                              fontWeight: "bold",
                              backgroundColor: badge.backgroundColor,
                              color: badge.color
                            }}>
                              {task.priority}
                            </span>
                          </div>

                          {task.description && (
                            <p style={{
                              margin: 0,
                              fontSize: "0.85rem",
                              color: "#666",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              wordBreak: "break-word"
                            }}>
                              {task.description}
                            </p>
                          )}

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px", fontSize: "0.8rem", color: "#777" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              {task.estimatedTime !== undefined && task.estimatedTime !== null && (
                                <span>Est: {task.estimatedTime}m</span>
                              )}
                              {task.dueDate && (
                                <span style={{ color: new Date(task.dueDate) < new Date() && task.status !== "Done" ? "#dc3545" : "#777" }}>
                                  Due: {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <div onClick={(e) => e.stopPropagation()}>
                              <select
                                value={task.status}
                                onChange={(e) => handleQuickStatusChange(task, e.target.value as any)}
                                style={{
                                  padding: "3px",
                                  fontSize: "0.8rem",
                                  border: "1px solid #ccc",
                                  borderRadius: "3px",
                                  color: "#333",
                                  backgroundColor: "#fff"
                                }}
                              >
                                <option value="To Do">To Do</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Done">Done</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
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
            width: "450px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            boxSizing: "border-box"
          }}>
            <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#333" }}>
              {activeTask ? "Edit Task" : "Create New Task"}
            </h3>
            <form onSubmit={handleTaskSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#666" }}>Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="Task title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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
                  placeholder="Task description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    padding: "8px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    fontSize: "0.95rem",
                    minHeight: "70px",
                    resize: "vertical",
                    fontFamily: "inherit",
                    color: "#333",
                    backgroundColor: "#fff"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#666" }}>Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    style={{
                      padding: "8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      fontSize: "0.95rem",
                      color: "#333",
                      backgroundColor: "#fff"
                    }}
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#666" }}>Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    style={{
                      padding: "8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      fontSize: "0.95rem",
                      color: "#333",
                      backgroundColor: "#fff"
                    }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#666" }}>Estimate (minutes)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 60"
                    value={estimatedTime}
                    onChange={(e) => setEstimatedTime(e.target.value === "" ? "" : Number(e.target.value))}
                    style={{
                      padding: "8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      fontSize: "0.95rem",
                      color: "#333",
                      backgroundColor: "#fff"
                    }}
                  />
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#666" }}>Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    style={{
                      padding: "8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      fontSize: "0.95rem",
                      color: "#333",
                      backgroundColor: "#fff",
                      colorScheme: "light"
                    }}
                  />
                </div>
              </div>

              {error && <span style={{ color: "#dc3545", fontSize: "0.85rem" }}>{error}</span>}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                <div>
                  {activeTask && (
                    <button
                      type="button"
                      onClick={handleDeleteTask}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#fff",
                        color: "#dc3545",
                        border: "1px solid #dc3545",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        fontWeight: "bold"
                      }}
                    >
                      Delete Task
                    </button>
                  )}
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
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
                    {activeTask ? "Save Changes" : "Create Task"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
