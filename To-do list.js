// ========== DOM Elements ==========
const inputBox = document.getElementById("input-box");
const listContainer = document.getElementById("list-container");
const addBtn = document.getElementById("add-btn");
const dueDateInput = document.getElementById("due-date");
const themeToggle = document.getElementById("theme-toggle");
const searchInput = document.getElementById("search-task");
const clearCompletedBtn = document.getElementById("clear-completed");
const deleteAllBtn = document.getElementById("delete-all");
const filterTitle = document.getElementById("filter-title");

// Category and Priority from pill buttons
let selectedCategory = "personal";
let selectedPriority = "medium";

// Setup category pills
document.querySelectorAll(".pill").forEach(pill => {
    pill.addEventListener("click", () => {
        document.querySelectorAll(".pill").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        selectedCategory = pill.dataset.category;
    });
});
// Set default active category
document.querySelector(".pill[data-category='personal']").classList.add("active");

// Setup priority pills
document.querySelectorAll(".priority-pill").forEach(pill => {
    pill.addEventListener("click", () => {
        document.querySelectorAll(".priority-pill").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        selectedPriority = pill.dataset.priority;
    });
});
// Set default active priority
document.querySelector(".priority-pill.medium").classList.add("active");

// Navigation
const navBtns = document.querySelectorAll(".nav-btn");
let currentFilter = "all";
let currentSearch = "";
let tasks = [];

// ========== Dark Mode ==========
if (localStorage.getItem("todoTheme") === "dark") {
    document.body.classList.add("dark");
    themeToggle.querySelector(".theme-text").textContent = "Light Mode";
    themeToggle.querySelector(".theme-icon").textContent = "☀️";
}

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    if (document.body.classList.contains("dark")) {
        localStorage.setItem("todoTheme", "dark");
        themeToggle.querySelector(".theme-text").textContent = "Light Mode";
        themeToggle.querySelector(".theme-icon").textContent = "☀️";
    } else {
        localStorage.setItem("todoTheme", "light");
        themeToggle.querySelector(".theme-text").textContent = "Dark Mode";
        themeToggle.querySelector(".theme-icon").textContent = "🌙";
    }
});

// ========== Add Task ==========
function addTask() {
    const taskText = inputBox.value.trim();
    
    if (taskText === "") {
        showNotification("Please enter a task!", "error");
        return;
    }
    
    const task = {
        id: Date.now(),
        text: taskText,
        completed: false,
        category: selectedCategory,
        dueDate: dueDateInput.value,
        priority: selectedPriority,
        createdAt: new Date().toISOString()
    };
    
    tasks.unshift(task);
    inputBox.value = "";
    dueDateInput.value = "";
    saveTasks();
    renderTasks();
    showNotification("Task added!", "success");
}

// ========== Delete Task ==========
function deleteTask(taskId) {
    tasks = tasks.filter(task => task.id !== taskId);
    saveTasks();
    renderTasks();
    showNotification("Task deleted!", "success");
}

// ========== Toggle Task ==========
function toggleTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
    }
}

// ========== Render Tasks ==========
function renderTasks() {
    let filteredTasks = [...tasks];
    
    if (currentFilter === "active") {
        filteredTasks = filteredTasks.filter(task => !task.completed);
    } else if (currentFilter === "completed") {
        filteredTasks = filteredTasks.filter(task => task.completed);
    }
    
    if (currentSearch) {
        filteredTasks = filteredTasks.filter(task => 
            task.text.toLowerCase().includes(currentSearch.toLowerCase())
        );
    }
    
    // Update nav counts
    document.getElementById("nav-all").textContent = tasks.length;
    document.getElementById("nav-active").textContent = tasks.filter(t => !t.completed).length;
    document.getElementById("nav-completed").textContent = tasks.filter(t => t.completed).length;
    
    if (filteredTasks.length === 0) {
        listContainer.innerHTML = '<div class="empty-state">✨ No tasks here. Add a new task to get started!</div>';
        updateStats();
        return;
    }
    
    listContainer.innerHTML = "";
    
    filteredTasks.forEach(task => {
        const li = document.createElement("li");
        if (task.completed) li.classList.add("checked");
        
        const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date();
        
        li.innerHTML = `
            <div class="task-checkbox"></div>
            <div class="task-details">
                <div class="task-title">${escapeHtml(task.text)}</div>
                <div class="task-meta">
                    <span class="task-category-badge ${task.category}">${task.category}</span>
                    <span class="task-priority-badge ${task.priority}">${task.priority}</span>
                    ${task.dueDate ? `<span class="task-date-badge ${isOverdue ? 'overdue' : ''}">📅 ${formatDate(task.dueDate)}</span>` : ''}
                </div>
            </div>
            <button class="delete-task-btn" data-id="${task.id}">✖</button>
        `;
        
        li.addEventListener("click", (e) => {
            if (!e.target.classList.contains("delete-task-btn")) {
                toggleTask(task.id);
            }
        });
        
        const deleteBtn = li.querySelector(".delete-task-btn");
        deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            deleteTask(task.id);
        });
        
        listContainer.appendChild(li);
    });
    
    updateStats();
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return "Today";
    return date.toLocaleDateString();
}

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const rate = total === 0 ? 0 : Math.round((completed / total) * 100);
    
    document.getElementById("total-tasks").textContent = total;
    document.getElementById("completed-tasks").textContent = completed;
    document.getElementById("pending-tasks").textContent = pending;
    document.getElementById("completion-rate").textContent = `${rate}%`;
}

function showNotification(message, type) {
    const notification = document.createElement("div");
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === "error" ? "#ef4444" : "#10b981"};
        color: white;
        border-radius: 12px;
        font-weight: 500;
        z-index: 1000;
        animation: slideInRight 0.3s ease;
        font-family: 'Inter', sans-serif;
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
}

// Add animation
const style = document.createElement("style");
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

// ========== Save/Load ==========
function saveTasks() {
    localStorage.setItem("todoTasks", JSON.stringify(tasks));
}

function loadTasks() {
    const saved = localStorage.getItem("todoTasks");
    if (saved) {
        tasks = JSON.parse(saved);
    }
    renderTasks();
}

// ========== Filters ==========
function setFilter(filter) {
    currentFilter = filter;
    navBtns.forEach(btn => {
        if (btn.dataset.filter === filter) {
            btn.classList.add("active");
            filterTitle.textContent = btn.querySelector("span:first-child").nextSibling.textContent.trim();
        } else {
            btn.classList.remove("active");
        }
    });
    renderTasks();
}

function clearCompleted() {
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    renderTasks();
    showNotification("Completed tasks cleared!", "success");
}

function deleteAllTasks() {
    if (confirm("Delete ALL tasks? This cannot be undone!")) {
        tasks = [];
        saveTasks();
        renderTasks();
        showNotification("All tasks deleted!", "success");
    }
}

// ========== Event Listeners ==========
addBtn.addEventListener("click", addTask);
inputBox.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addTask();
});

navBtns.forEach(btn => {
    btn.addEventListener("click", () => setFilter(btn.dataset.filter));
});

searchInput.addEventListener("input", (e) => {
    currentSearch = e.target.value;
    renderTasks();
});

clearCompletedBtn.addEventListener("click", clearCompleted);
deleteAllBtn.addEventListener("click", deleteAllTasks);

dueDateInput.valueAsDate = new Date();

// Initialize
loadTasks();
setFilter("all");