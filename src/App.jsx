import { useEffect, useState } from "react";
import { 
  Plus, 
  Trash2, 
  Check, 
  RefreshCw, 
  Settings, 
  Server, 
  CheckCircle2, 
  Wifi, 
  WifiOff,
  ListTodo
} from "lucide-react";

// Default API URL from environment variable or local server
const DEFAULT_API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function App() {
  const [apiUrl, setApiUrl] = useState(() => {
    return localStorage.getItem("TRIAL_API_URL") || DEFAULT_API_URL;
  });

  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("checking"); // 'online' | 'offline' | 'checking'
  const [serverMeta, setServerMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [tempUrl, setTempUrl] = useState(apiUrl);

  // Check connection to backend
  const checkServer = async (url = apiUrl) => {
    setStatus("checking");
    try {
      const response = await fetch(`${url}/api/status`, {
        signal: AbortSignal.timeout(4000)
      });
      if (response.ok) {
        const data = await response.json();
        setStatus("online");
        setServerMeta(data);
      } else {
        setStatus("offline");
        setServerMeta(null);
      }
    } catch (err) {
      setStatus("offline");
      setServerMeta(null);
    }
  };

  // Fetch all todo items
  const loadTodos = async (url = apiUrl) => {
    setLoading(true);
    try {
      const response = await fetch(`${url}/api/todos`);
      if (response.ok) {
        const data = await response.json();
        setTodos(data);
      }
    } catch (err) {
      console.error("Failed to load todos:", err);
    } finally {
      setLoading(false);
    }
  };

  // Add a new todo item
  const addTodo = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const response = await fetch(`${apiUrl}/api/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() })
      });

      if (response.ok) {
        setTitle("");
        await loadTodos();
      }
    } catch (err) {
      alert("Gagal menambah todo. Pastikan backend online!");
    }
  };

  // Toggle completed status
  const toggleTodo = async (id, currentCompleted) => {
    try {
      const response = await fetch(`${apiUrl}/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !currentCompleted })
      });

      if (response.ok) {
        loadTodos();
      }
    } catch (err) {
      console.error("Failed to update todo:", err);
    }
  };

  // Delete a todo item
  const deleteTodo = async (id) => {
    try {
      const response = await fetch(`${apiUrl}/api/todos/${id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        loadTodos();
      }
    } catch (err) {
      alert("Gagal menghapus todo. Periksa koneksi backend.");
    }
  };

  // Save customized API URL
  const handleSaveConfig = () => {
    const formattedUrl = tempUrl.replace(/\/+$/, ""); // Trim trailing slashes
    setApiUrl(formattedUrl);
    localStorage.setItem("TRIAL_API_URL", formattedUrl);
    setShowConfigModal(false);
    checkServer(formattedUrl);
    loadTodos(formattedUrl);
  };

  const handleResetConfig = () => {
    setTempUrl(DEFAULT_API_URL);
  };

  useEffect(() => {
    checkServer();
    loadTodos();

    // Periodically check server status every 15 seconds
    const interval = setInterval(() => {
      checkServer();
    }, 15000);

    return () => clearInterval(interval);
  }, [apiUrl]);

  return (
    <div className="app-container">
      {/* App Header */}
      <header className="app-header">
        <div className="title-area">
          <h1>
            <ListTodo className="icon" size={28} style={{ color: "#6366f1" }} />
            Trial Todo App
          </h1>
          <p>React Frontend + Express Backend Trial Setup</p>
        </div>

        {/* Server Status Badge */}
        <div className={`status-badge ${status}`} title={`Target: ${apiUrl}`}>
          <span className="status-dot"></span>
          {status === "online" && (
            <>
              <Wifi size={14} /> Backend Online ({serverMeta?.server || "LOCAL"})
            </>
          )}
          {status === "offline" && (
            <>
              <WifiOff size={14} /> Backend Offline
            </>
          )}
          {status === "checking" && (
            <>
              <RefreshCw size={14} className="spin" /> Checking...
            </>
          )}
        </div>
      </header>

      {/* Endpoint Info & Config Switcher */}
      <div className="config-bar">
        <div className="url-info">
          <Server size={14} />
          <span>API Endpoint:</span>
          <code>{apiUrl}</code>
        </div>
        <button 
          className="config-btn" 
          onClick={() => {
            setTempUrl(apiUrl);
            setShowConfigModal(true);
          }}
        >
          <Settings size={14} style={{ display: 'inline', marginRight: 4 }} />
          Ubah API
        </button>
      </div>

      {/* Add Todo Form */}
      <form className="todo-form" onSubmit={addTodo}>
        <input
          type="text"
          className="todo-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tuliskan tugas baru..."
          disabled={status === "offline"}
        />
        <button 
          type="submit" 
          className="add-btn" 
          disabled={status === "offline" || !title.trim()}
        >
          <Plus size={18} />
          Tambah
        </button>
      </form>

      {/* Todo Items List */}
      {loading && todos.length === 0 ? (
        <div className="empty-state">
          <RefreshCw className="spin empty-icon" />
          <p>Memuat tugas...</p>
        </div>
      ) : todos.length === 0 ? (
        <div className="empty-state">
          <CheckCircle2 className="empty-icon" />
          <p>Belum ada tugas. Tuliskan di atas!</p>
        </div>
      ) : (
        <ul className="todo-list">
          {todos.map((todo) => (
            <li 
              key={todo.id} 
              className={`todo-item ${todo.completed ? "completed" : ""}`}
            >
              <div className="todo-content">
                <div 
                  className="checkbox-custom" 
                  onClick={() => toggleTodo(todo.id, todo.completed)}
                >
                  {todo.completed && <Check size={14} color="#ffffff" />}
                </div>
                <span 
                  className="todo-title"
                  onClick={() => toggleTodo(todo.id, todo.completed)}
                  style={{ cursor: 'pointer' }}
                >
                  {todo.title}
                </span>
              </div>
              <button 
                className="delete-btn" 
                onClick={() => deleteTodo(todo.id)}
                title="Hapus Tugas"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Modal Settings API URL */}
      {showConfigModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Pengaturan Backend API URL</h3>
            <p>
              Ganti URL endpoint API. Gunakan <code>http://localhost:3000</code> saat dev lokal, 
              atau URL Cloudflare Tunnel Anda (misal: <code>https://api-trial.cbapabrik.com</code>) saat pengujian internet.
            </p>

            <input
              type="text"
              className="todo-input"
              value={tempUrl}
              onChange={(e) => setTempUrl(e.target.value)}
              placeholder="https://api-trial.domain-anda.com"
              style={{ width: "100%", marginBottom: 12 }}
            />

            <div className="modal-actions">
              <button 
                className="btn-secondary"
                onClick={handleResetConfig}
              >
                Reset Default
              </button>
              <button 
                className="btn-secondary"
                onClick={() => setShowConfigModal(false)}
              >
                Batal
              </button>
              <button 
                className="btn-primary"
                onClick={handleSaveConfig}
              >
                Simpan & Tes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
