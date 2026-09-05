export function TaskList({ tasks, onToggle, onDelete }) {
  if (tasks.length === 0) {
    return <p className="empty">Todavia no tienes tareas. Agrega la primera arriba.</p>;
  }

  return (
    <ul className="tasks">
      {tasks.map((task) => (
        <li key={task.id} className={task.done ? 'done' : ''}>
          <label>
            <input
              type="checkbox"
              checked={Boolean(task.done)}
              onChange={() => onToggle(task)}
            />
            <span>{task.title}</span>
          </label>
          <button
            type="button"
            className="delete"
            onClick={() => onDelete(task)}
            aria-label={`Eliminar ${task.title}`}
          >
            Eliminar
          </button>
        </li>
      ))}
    </ul>
  );
}
