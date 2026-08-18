import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import api from "../services/api";
import "./TaskBoard.css";

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

  // Audit History states
  const [activeTab, setActiveTab] = useState<"time" | "history">("time");
  const [historyEntries, setHistoryEntries] = useState<any[]>([]);

  const fetchTaskHistory = async (taskId: string) => {
    try {
      const response = await api.get(`/tasks/${taskId}/history`);
      setHistoryEntries(response.data.history || []);
    } catch (err) {
      console.error("Failed to fetch task history:", err);
    }
  };

  const formatHistoryEntry = (entry: any) => {
    const parseJSON = (str: string) => {
      try {
        return JSON.parse(str);
      } catch {
        return {};
      }
    };

    switch (entry.action) {
      case "create":
        return "Created the task";
      case "update": {
        const field = entry.fieldName;
        const oldVal = entry.oldValue;
        const newVal = entry.newValue;

        if (field === "title") {
          return `Changed title from "${oldVal}" to "${newVal}"`;
        }
        if (field === "description") {
          return `Changed description from "${oldVal || "(none)"}" to "${newVal || "(none)"}"`;
        }
        if (field === "status") {
          return `Changed status from "${oldVal}" to "${newVal}"`;
        }
        if (field === "priority") {
          return `Changed priority from "${oldVal}" to "${newVal}"`;
        }
        if (field === "estimatedTime") {
          const oldEst = oldVal ? `${oldVal}m` : "none";
          const newEst = newVal ? `${newVal}m` : "none";
          return `Changed estimate from ${oldEst} to ${newEst}`;
        }
        if (field === "dueDate") {
          const oldDateStr = oldVal ? new Date(oldVal).toISOString().split("T")[0] : "none";
          const newDateStr = newVal ? new Date(newVal).toISOString().split("T")[0] : "none";
          return `Changed due date from ${oldDateStr} to ${newDateStr}`;
        }
        return `Changed ${field} from "${oldVal || "none"}" to "${newVal || "none"}"`;
      }
      case "time_entry_create": {
        const parsed = parseJSON(entry.newValue);
        return `Logged work: ${parsed.duration}m on ${parsed.date}${parsed.note ? ` (Note: "${parsed.note}")` : ""}`;
      }
      case "time_entry_update": {
        const oldP = parseJSON(entry.oldValue);
        const newP = parseJSON(entry.newValue);
        return `Updated logged work: changed from ${oldP.duration}m on ${oldP.date}${oldP.note ? ` (Note: "${oldP.note}")` : ""} to ${newP.duration}m on ${newP.date}${newP.note ? ` (Note: "${newP.note}")` : ""}`;
      }
      case "time_entry_delete": {
        const parsed = parseJSON(entry.oldValue);
        return `Deleted logged work of ${parsed.duration}m on ${parsed.date}${parsed.note ? ` (Note: "${parsed.note}")` : ""}`;
      }
      default:
        return `Performed ${entry.action} action`;
    }
  };

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
      await fetchTaskHistory(activeTask.id);
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
        await fetchTaskHistory(activeTask.id);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        fetchTaskHistory(task.id);
        setActiveTab("time");
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

  const getPriorityBadgeClassName = (taskPriority: string) => {
    switch (taskPriority) {
      case "High":
        return "task-board__priority-badge--high";
      case "Medium":
        return "task-board__priority-badge--medium";
      case "Low":
      default:
        return "task-board__priority-badge--low";
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
    <div className="task-board">
      <div className="task-board__toolbar">
        {/* Left Side: Search and Dropdowns */}
        <div className="task-board__filters">
          <div className="task-board__search">
            <input
              type="text"
              placeholder="Search by title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="task-board__search-input"
            />
            {/* Search Icon */}
            <span className="task-board__search-icon">🔍</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="task-board__filter-select"
          >
            <option value="">All Statuses</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="task-board__filter-select"
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
              className="task-board__clear-filters"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Right Side: Overdue Toggle */}
        <div className="task-board__overdue-filter">
          <label className={`task-board__overdue-label${overdueOnly ? " task-board__overdue-label--active" : ""}`}>
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(e) => setOverdueOnly(e.target.checked)}
              className="task-board__overdue-checkbox"
            />
            <span className={`task-board__overdue-text${overdueOnly ? " task-board__overdue-text--active" : ""}`}>
              Show Overdue Only
            </span>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="task-board__loading">Loading tasks...</div>
      ) : fetchError ? (
        <div className="task-board__fetch-error">
          <div>{fetchError}</div>
          <button onClick={fetchTasks} className="task-board__retry-button">Retry</button>
        </div>
      ) : (
        <div className="task-board__columns">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.title);
            return (
              <div
                key={col.title}
                className="task-board__column"
              >
                <div className="task-board__column-header">
                  <h3 className="task-board__column-title">
                    {col.title} <span className="task-board__column-count">({colTasks.length})</span>
                  </h3>
                  <button
                    onClick={() => handleOpenCreateModal(col.title)}
                    className="task-board__add-button"
                    title="Add task to this column"
                  >
                    +
                  </button>
                </div>

                <div className="task-board__task-list">
                  {colTasks.length === 0 ? (
                    <div className="task-board__empty-column">
                      No tasks in this column.
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "Done";
                      return (
                        <div
                          key={task.id}
                          className={`task-board__task-card${isOverdue ? " task-board__task-card--overdue" : ""}`}
                          onClick={() => handleOpenEditModal(task)}
                        >
                          <div className="task-board__task-header">
                            <span className="task-board__task-title">
                              {task.title}
                            </span>
                            <div className="task-board__badges">
                              {isOverdue && (
                                <span className="task-board__overdue-badge">
                                  ⚠️ Overdue
                                </span>
                              )}
                              <span className={`task-board__priority-badge ${getPriorityBadgeClassName(task.priority)}`}>
                                {task.priority}
                              </span>
                            </div>
                          </div>

                          {task.description && (
                            <p className="task-board__task-description">
                              {task.description}
                            </p>
                          )}

                          <div className="task-board__task-footer">
                            <div className="task-board__task-meta">
                              {task.estimatedTime !== undefined && task.estimatedTime !== null && (
                                <span>Est: {task.estimatedTime}m</span>
                              )}
                              {task.totalLoggedTime !== undefined && Number(task.totalLoggedTime) > 0 && (
                                <span className="task-board__logged-time">Logged: {task.totalLoggedTime}m</span>
                              )}
                              {task.dueDate && (
                                <span className={isOverdue ? "task-board__due-date task-board__due-date--overdue" : "task-board__due-date"}>
                                  Due: {new Date(task.dueDate).toLocaleDateString()}
                                  {isOverdue && getOverdueDaysText(task.dueDate)}
                                </span>
                              )}
                            </div>
                            <div onClick={(e) => e.stopPropagation()}>
                              <select
                                value={task.status}
                                onChange={(e) => handleQuickStatusChange(task, e.target.value as any)}
                                className="task-board__quick-status"
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
        <div className="task-board__modal-overlay">
          <div className={`task-board__modal${activeTask ? " task-board__modal--wide" : ""}`}>
            <h3 className="task-board__modal-title">
              {activeTask ? "Edit Task" : "Create New Task"}
            </h3>
            
            <div className={`task-board__modal-body${activeTask ? " task-board__modal-body--wide" : ""}`}>
              {/* Left Column: Task details Form */}
              <form onSubmit={handleTaskSubmit} className="task-board__task-form">
              <div className="task-board__field">
                <label className="task-board__label">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="Task title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="task-board__input"
                  autoFocus
                />
              </div>

              <div className="task-board__field">
                <label className="task-board__label">Description</label>
                <textarea
                  placeholder="Task description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="task-board__textarea"
                />
              </div>

              <div className="task-board__field-row">
                <div className="task-board__field task-board__field--grow">
                  <label className="task-board__label">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="task-board__input"
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                <div className="task-board__field task-board__field--grow">
                  <label className="task-board__label">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="task-board__input"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="task-board__field-row">
                <div className="task-board__field task-board__field--grow">
                  <label className="task-board__label">Estimate (minutes)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 60"
                    value={estimatedTime}
                    onChange={(e) => setEstimatedTime(e.target.value === "" ? "" : Number(e.target.value))}
                    className="task-board__input"
                  />
                </div>

                <div className="task-board__field task-board__field--grow">
                  <label className="task-board__label">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="task-board__input task-board__date-input"
                  />
                </div>
              </div>

              {error && <span className="task-board__error-text">{error}</span>}

              <div className="task-board__form-actions">
                <div>
                  {activeTask && (
                    <button
                      type="button"
                      onClick={handleDeleteTask}
                      className="task-board__button task-board__button--danger"
                    >
                      Delete Task
                    </button>
                  )}
                </div>
                <div className="task-board__button-row">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setError(null);
                      if (activeTask) {
                        navigate(`/home/projects/${projectId}`);
                      }
                    }}
                    className="task-board__button task-board__button--secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="task-board__button task-board__button--primary"
                  >
                    {activeTask ? "Save Changes" : "Create Task"}
                  </button>
                </div>
              </div>
            </form>

            {/* Right Column: Time Tracking & Audit History */}
            {activeTask && (
              <div className="task-board__side-panel">
                {/* Tab Switcher */}
                <div className="task-board__tabs">
                  <button
                    type="button"
                    onClick={() => setActiveTab("time")}
                    className={`task-board__tab${activeTab === "time" ? " task-board__tab--active" : ""}`}
                  >
                    Time Tracking
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("history")}
                    className={`task-board__tab${activeTab === "history" ? " task-board__tab--active" : ""}`}
                  >
                    Activity History
                  </button>
                </div>

                {activeTab === "time" && (
                  <div className="task-board__time-tab">
                    {/* Stats */}
                    <div className="task-board__stats">
                      <div className="task-board__stat">
                        <div className="task-board__stat-label">Logged Time</div>
                        <div className="task-board__stat-value">{totalLoggedTime}m</div>
                      </div>
                      {remainingTime !== null && (
                        <div className="task-board__stat">
                          <div className="task-board__stat-label">Remaining</div>
                          <div className={`task-board__stat-value${remainingTime > 0 ? " task-board__stat-value--positive" : ""}`}>
                            {remainingTime}m
                          </div>
                        </div>
                      )}
                      {overrunTime !== null && overrunTime > 0 && (
                        <div className="task-board__stat">
                          <div className="task-board__stat-label task-board__stat-label--danger">Overrun ⚠️</div>
                          <div className="task-board__stat-value task-board__stat-value--danger">
                            {overrunTime}m
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Log Entry Form */}
                    <form onSubmit={handleTimeSubmit} className="task-board__log-form">
                      <div className="task-board__log-title">
                        {editingEntryId ? "Edit Time Entry" : "Log Work"}
                      </div>
                      
                      <div className="task-board__field-row">
                        <div className="task-board__field task-board__field--compact task-board__field--grow">
                          <label className="task-board__small-label">Duration (m)*</label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={logDuration}
                            onChange={(e) => setLogDuration(e.target.value === "" ? "" : Number(e.target.value))}
                            className="task-board__small-input"
                          />
                        </div>
                        <div className="task-board__field task-board__field--compact task-board__field--grow">
                          <label className="task-board__small-label">Date*</label>
                          <input
                            type="date"
                            required
                            value={logDate}
                            onChange={(e) => setLogDate(e.target.value)}
                            className="task-board__small-input task-board__date-input"
                          />
                        </div>
                      </div>

                      <div className="task-board__field task-board__field--compact">
                        <label className="task-board__small-label">Note (optional)</label>
                        <input
                          type="text"
                          placeholder="What did you work on?"
                          value={logNote}
                          onChange={(e) => setLogNote(e.target.value)}
                          className="task-board__small-input"
                        />
                      </div>

                      {timeError && <span className="task-board__time-error">{timeError}</span>}

                      <div className="task-board__log-actions">
                        <button
                          type="submit"
                          className="task-board__button task-board__button--primary task-board__button--grow task-board__button--small"
                        >
                          {editingEntryId ? "Save Log" : "Log Work"}
                        </button>
                        {editingEntryId && (
                          <button
                            type="button"
                            onClick={handleCancelEditEntry}
                            className="task-board__button task-board__button--secondary task-board__button--small"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>

                    {/* Entry Log List */}
                    <div className="task-board__entry-list">
                      <div className="task-board__section-title">Logged Sessions</div>
                      {timeEntries.length === 0 ? (
                        <div className="task-board__empty-log">
                          No work logged yet.
                        </div>
                      ) : (
                        timeEntries.map((entry) => (
                          <div key={entry.id} className="task-board__entry-card">
                            <div className="task-board__entry-header">
                              <span className="task-board__entry-duration">{entry.duration}m</span>
                              <span className="task-board__entry-date">{entry.date}</span>
                            </div>
                            {entry.note && (
                              <div className="task-board__entry-note">
                                {entry.note}
                              </div>
                            )}
                            <div className="task-board__entry-actions">
                              <button
                                type="button"
                                onClick={() => handleEditEntry(entry)}
                                className="task-board__text-button task-board__text-button--primary"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteEntry(entry.id)}
                                className="task-board__text-button task-board__text-button--danger"
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

                {activeTab === "history" && (
                  <div className="task-board__history-tab">
                    <div className="task-board__section-title task-board__section-title--spaced">Task Activity Log</div>
                    {historyEntries.length === 0 ? (
                      <div className="task-board__empty-log">
                        No changes recorded yet.
                      </div>
                    ) : (
                      historyEntries.map((entry) => {
                        const description = formatHistoryEntry(entry);
                        return (
                          <div key={entry.id} className="task-board__entry-card">
                            <div className="task-board__history-description">
                              {description}
                            </div>
                            <div className="task-board__history-meta">
                              <span>By: {entry.actor?.name || entry.actor?.email || "Unknown"}</span>
                              <span>{new Date(entry.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
