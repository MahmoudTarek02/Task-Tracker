import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
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
  totalLoggedTime?: number;
}

interface TaskBoardProps {
  projectId: string;
  onTasksChange: () => void;
}

export default function TaskBoard({ projectId, onTasksChange }: TaskBoardProps) {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

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

  // Time logging states
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [totalLoggedTime, setTotalLoggedTime] = useState<number>(0);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [overrunTime, setOverrunTime] = useState<number | null>(null);

  // Time logging form states
  const [logDuration, setLogDuration] = useState<number | "">("");
  const [logDate, setLogDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [logNote, setLogNote] = useState<string>("");
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);

  const fetchTimeEntries = async (taskId: string) => {
    try {
      const response = await api.get(`/tasks/${taskId}/time-entries`);
      setTimeEntries(response.data.timeEntries || []);
      setTotalLoggedTime(response.data.totalLoggedTime || 0);
      setRemainingTime(response.data.remainingTime);
      setOverrunTime(response.data.overrunTime);
    } catch (err: any) {
      console.error("Failed to fetch time entries:", err);
    }
  };

  const handleTimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask) return;
    setTimeError(null);

    if (logDuration === "" || Number(logDuration) <= 0) {
      setTimeError("Duration must be a positive number of minutes");
      return;
    }

    const payload = {
      duration: Number(logDuration),
      date: logDate,
      note: logNote.trim() || null,
    };

    try {
      if (editingEntryId) {
        await api.put(`/time-entries/${editingEntryId}`, payload);
      } else {
        await api.post(`/tasks/${activeTask.id}/time-entries`, payload);
      }
      await fetchTimeEntries(activeTask.id);
      setLogDuration("");
      setLogDate(new Date().toISOString().split("T")[0]);
      setLogNote("");
      setEditingEntryId(null);
      // to update the task card in the main kanban board
      fetchTasks();
    } catch (err: any) {
      setTimeError(err.response?.data?.message || "Failed to save time entry.");
    }
  };

  const handleEditEntry = (entry: any) => {
    setEditingEntryId(entry.id);
    setLogDuration(entry.duration);
    setLogDate(entry.date);
    setLogNote(entry.note || "");
  };

  const handleCancelEditEntry = () => {
    setEditingEntryId(null);
    setLogDuration("");
    setLogDate(new Date().toISOString().split("T")[0]);
    setLogNote("");
  };

  const handleDeleteEntry = async (entryId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this time entry?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/time-entries/${entryId}`);
      if (activeTask) {
        await fetchTimeEntries(activeTask.id);
        fetchTasks();
      }
    } catch (err: any) {
      setTimeError(err.response?.data?.message || "Failed to delete time entry.");
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const queryParams = new URLSearchParams();
      queryParams.append("projectId", projectId);

      if (debouncedSearch.trim()) {
        queryParams.append("search", debouncedSearch.trim());
      }
      if (statusFilter) {
        queryParams.append("status", statusFilter);
      }
      if (priorityFilter) {
        queryParams.append("priority", priorityFilter);
      }
      if (overdueOnly) {
        queryParams.append("overdue", "true");
      }

      const response = await api.get(`/tasks?${queryParams.toString()}`);
      setTasks(response.data.tasks || []);
    } catch (err: any) {
      console.error("Failed to load tasks:", err);
      setFetchError(err.response?.data?.message || "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    fetchTasks();
  }, [projectId, debouncedSearch, statusFilter, priorityFilter, overdueOnly]);

  useEffect(() => {
    if (taskId && tasks.length > 0) {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        setActiveTask(task);
        setTitle(task.title);
        setDescription(task.description || "");
        setStatus(task.status);
        setPriority(task.priority);
        setEstimatedTime(task.estimatedTime !== undefined && task.estimatedTime !== null ? task.estimatedTime : "");
        setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
        setError(null);
        setShowModal(true);
        fetchTimeEntries(task.id);
        setLogDuration("");
        setLogDate(new Date().toISOString().split("T")[0]);
        setLogNote("");
        setEditingEntryId(null);
        setTimeError(null);
      } else {
        setShowModal(false);
        setActiveTask(null);
      }
    } else if (!taskId) {
      if (activeTask) {
        setShowModal(false);
        setActiveTask(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, tasks]);

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
    navigate(`/home/projects/${projectId}/tasks/${task.id}`);
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
        await api.put(`/tasks/${activeTask.id}`, payload);
        navigate(`/home/projects/${projectId}`);
      } else {
        // Create mode
        await api.post("/tasks", payload);
        setShowModal(false);
      }
      fetchTasks();
      onTasksChange();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save task.");
    }
  };

  const handleQuickStatusChange = async (task: Task, newStatus: "To Do" | "In Progress" | "Done") => {
    try {
      await api.put(`/tasks/${task.id}`, { status: newStatus });
      fetchTasks();
      onTasksChange();
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
      navigate(`/home/projects/${projectId}`);
      fetchTasks();
      onTasksChange();
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

  const getOverdueDaysText = (dueDateStr: string) => {
    const dueDate = new Date(dueDateStr);
    const today = new Date();
    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "";
    return ` (Overdue by ${diffDays} day${diffDays > 1 ? "s" : ""})`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", height: "100%" }}>
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "15px",
        paddingBottom: "15px",
        borderBottom: "1px solid #f0f0f0"
      }}>
        {/* Left Side: Search and Dropdowns */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px", flex: 1, minWidth: "280px" }}>
          <div style={{ position: "relative", flex: 1, maxWidth: "300px", minWidth: "180px" }}>
            <input
              type="text"
              placeholder="Search by title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 32px",
                fontSize: "0.9rem",
                borderRadius: "6px",
                border: "1px solid #ccc",
                backgroundColor: "#fff",
                color: "#333",
                boxSizing: "border-box",
                outline: "none",
                transition: "border-color 0.2s"
              }}
              onFocus={(e) => e.target.style.borderColor = "#0052cc"}
              onBlur={(e) => e.target.style.borderColor = "#ccc"}
            />
            {/* Search Icon */}
            <span style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "0.9rem",
              color: "#aaa",
              pointerEvents: "none"
            }}>🔍</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              fontSize: "0.9rem",
              borderRadius: "6px",
              border: "1px solid #ccc",
              backgroundColor: "#fff",
              color: "#333",
              cursor: "pointer",
              outline: "none"
            }}
          >
            <option value="">All Statuses</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              fontSize: "0.9rem",
              borderRadius: "6px",
              border: "1px solid #ccc",
              backgroundColor: "#fff",
              color: "#333",
              cursor: "pointer",
              outline: "none"
            }}
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>

          {(search || statusFilter || priorityFilter || overdueOnly) && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setPriorityFilter("");
                setOverdueOnly(false);
              }}
              style={{
                padding: "8px 14px",
                fontSize: "0.85rem",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "#f4f5f7",
                color: "#5e6c84",
                cursor: "pointer",
                fontWeight: "600",
                transition: "background 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#ebecf0"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f4f5f7"}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Right Side: Overdue Toggle */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            fontSize: "0.9rem",
            color: "#333",
            userSelect: "none",
            backgroundColor: overdueOnly ? "#ffebe6" : "transparent",
            padding: "6px 12px",
            borderRadius: "6px",
            border: overdueOnly ? "1px solid #ffbdad" : "1px solid transparent",
            transition: "all 0.2s"
          }}>
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(e) => setOverdueOnly(e.target.checked)}
              style={{ width: "16px", height: "16px", cursor: "pointer" }}
            />
            <span style={{ fontWeight: overdueOnly ? "600" : "normal", color: overdueOnly ? "#bf2600" : "#333" }}>
              Show Overdue Only
            </span>
          </label>
        </div>
      </div>

      {loading ? (
        <div style={{ fontSize: "1.1rem", color: "#666" }}>Loading tasks...</div>
      ) : fetchError ? (
        <div style={{ padding: "20px", backgroundColor: "#ffebe6", color: "#c53929", borderRadius: "6px", border: "1px solid #ffd2cc", display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-start" }}>
          <div>{fetchError}</div>
          <button onClick={fetchTasks} style={{ padding: "8px 16px", backgroundColor: "#de350b", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "600" }}>Retry</button>
        </div>
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
                      const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "Done";
                      return (
                        <div
                          key={task.id}
                          style={{
                            backgroundColor: "#fff",
                            border: "1px solid #ddd",
                            borderLeft: isOverdue ? "4px solid #dc3545" : "1px solid #ddd",
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
                            <div style={{ display: "flex", gap: "5px", alignItems: "center", flexShrink: 0 }}>
                              {isOverdue && (
                                <span style={{
                                  padding: "2px 6px",
                                  borderRadius: "3px",
                                  fontSize: "0.75rem",
                                  fontWeight: "bold",
                                  backgroundColor: "#ffebe6",
                                  color: "#bf2600"
                                }}>
                                  ⚠️ Overdue
                                </span>
                              )}
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
                              {task.totalLoggedTime !== undefined && Number(task.totalLoggedTime) > 0 && (
                                <span style={{ color: "#006644", fontWeight: "500" }}>Logged: {task.totalLoggedTime}m</span>
                              )}
                              {task.dueDate && (
                                <span style={{ color: isOverdue ? "#dc3545" : "#777" }}>
                                  Due: {new Date(task.dueDate).toLocaleDateString()}
                                  {isOverdue && getOverdueDaysText(task.dueDate)}
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
            width: activeTask ? "850px" : "450px",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            boxSizing: "border-box"
          }}>
            <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#333" }}>
              {activeTask ? "Edit Task" : "Create New Task"}
            </h3>
            
            <div style={{
              display: "flex",
              flexDirection: activeTask ? "row" : "column",
              gap: "24px",
              alignItems: "stretch"
            }}>
              {/* Left Column: Task details Form */}
              <form onSubmit={handleTaskSubmit} style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
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
                    onClick={() => {
                      setShowModal(false);
                      setError(null);
                      if (activeTask) {
                        navigate(`/home/projects/${projectId}`);
                      }
                    }}
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

            {/* Right Column: Time Tracking Log */}
            {activeTask && (
              <div style={{
                flex: 1,
                borderLeft: "1px solid #eee",
                paddingLeft: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px"
              }}>
                <h4 style={{ margin: 0, fontSize: "1rem", color: "#333" }}>Time Tracking</h4>
                
                {/* Stats */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", backgroundColor: "#f8f9fa", padding: "12px", borderRadius: "6px" }}>
                  <div style={{ flex: 1, minWidth: "80px" }}>
                    <div style={{ fontSize: "0.8rem", color: "#666" }}>Logged Time</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#333" }}>{totalLoggedTime}m</div>
                  </div>
                  {remainingTime !== null && (
                    <div style={{ flex: 1, minWidth: "80px" }}>
                      <div style={{ fontSize: "0.8rem", color: "#666" }}>Remaining</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: remainingTime > 0 ? "#28a745" : "#333" }}>
                        {remainingTime}m
                      </div>
                    </div>
                  )}
                  {overrunTime !== null && overrunTime > 0 && (
                    <div style={{ flex: 1, minWidth: "80px" }}>
                      <div style={{ fontSize: "0.8rem", color: "#dc3545" }}>Overrun ⚠️</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#dc3545" }}>
                        {overrunTime}m
                      </div>
                    </div>
                  )}
                </div>

                {/* Log Entry Form */}
                <form onSubmit={handleTimeSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "12px", border: "1px solid #e9e9e9", borderRadius: "6px", backgroundColor: "#fafafa" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#555" }}>
                    {editingEntryId ? "Edit Time Entry" : "Log Work"}
                  </div>
                  
                  <div style={{ display: "flex", gap: "10px" }}>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label style={{ fontSize: "0.75rem", color: "#666" }}>Duration (m)*</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={logDuration}
                        onChange={(e) => setLogDuration(e.target.value === "" ? "" : Number(e.target.value))}
                        style={{ padding: "6px", fontSize: "0.85rem", border: "1px solid #ccc", borderRadius: "4px", backgroundColor: "#fff", color: "#333" }}
                      />
                    </div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label style={{ fontSize: "0.75rem", color: "#666" }}>Date*</label>
                      <input
                        type="date"
                        required
                        value={logDate}
                        onChange={(e) => setLogDate(e.target.value)}
                        style={{ padding: "6px", fontSize: "0.85rem", border: "1px solid #ccc", borderRadius: "4px", backgroundColor: "#fff", color: "#333", colorScheme: "light" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "0.75rem", color: "#666" }}>Note (optional)</label>
                    <input
                      type="text"
                      placeholder="What did you work on?"
                      value={logNote}
                      onChange={(e) => setLogNote(e.target.value)}
                      style={{ padding: "6px", fontSize: "0.85rem", border: "1px solid #ccc", borderRadius: "4px", backgroundColor: "#fff", color: "#333" }}
                    />
                  </div>

                  {timeError && <span style={{ color: "#dc3545", fontSize: "0.75rem" }}>{timeError}</span>}

                  <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                    <button
                      type="submit"
                      style={{ flex: 1, padding: "6px 12px", backgroundColor: "#0052cc", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.85rem" }}
                    >
                      {editingEntryId ? "Save Log" : "Log Work"}
                    </button>
                    {editingEntryId && (
                      <button
                        type="button"
                        onClick={handleCancelEditEntry}
                        style={{ padding: "6px 12px", backgroundColor: "#fff", color: "#333", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer", fontSize: "0.85rem" }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>

                {/* Entry Log List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, overflowY: "auto", maxHeight: "200px", border: "1px solid #eee", padding: "8px", borderRadius: "6px" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#666" }}>Logged Sessions</div>
                  {timeEntries.length === 0 ? (
                    <div style={{ fontSize: "0.8rem", color: "#999", fontStyle: "italic", textAlign: "center", padding: "16px 0" }}>
                      No work logged yet.
                    </div>
                  ) : (
                    timeEntries.map((entry) => (
                      <div key={entry.id} style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "8px", border: "1px solid #f0f0f0", borderRadius: "4px", backgroundColor: "#fafafa" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#333" }}>{entry.duration}m</span>
                          <span style={{ fontSize: "0.75rem", color: "#777" }}>{entry.date}</span>
                        </div>
                        {entry.note && (
                          <div style={{ fontSize: "0.75rem", color: "#555", wordBreak: "break-word" }}>
                            {entry.note}
                          </div>
                        )}
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "2px" }}>
                          <button
                            type="button"
                            onClick={() => handleEditEntry(entry)}
                            style={{ border: "none", backgroundColor: "transparent", color: "#0052cc", cursor: "pointer", fontSize: "0.7rem", padding: "2px 0" }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEntry(entry.id)}
                            style={{ border: "none", backgroundColor: "transparent", color: "#dc3545", cursor: "pointer", fontSize: "0.7rem", padding: "2px 0" }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
