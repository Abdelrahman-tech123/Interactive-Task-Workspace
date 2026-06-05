'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function ToDoPage() {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    const [todos, setTodos] = useState([]);
    const [checked, setChecked] = useState([]);

    // 1. Manage the active user state (Defaulting to 'user')
    const [username, setUsername] = useState('user');
    const [userInput, setUserInput] = useState('');

    const syncStatus = useRef('idle');

    // EFFECT 1: Runs on mount AND whenever the active username changes
    useEffect(() => {
        const fetchItems = async () => {
            syncStatus.current = 'fetching';
            try {
                // Appending the specific username to the API path
                const response = await axios.get(`${API_BASE_URL}/api/todos/${username}`);
                if (response.status === 200) {
                    const data = response.data;
                    setTodos(data.todos || []);
                    setChecked(data.completed || []);

                    setTimeout(() => {
                        syncStatus.current = 'loaded';
                    }, 100);
                }
            }
            catch (error) {
                console.error("Error fetching tasks:", error);
                syncStatus.current = 'idle';
            }
        }
        fetchItems();
    }, [username]); // Listens to user switches!


    // EFFECT 2: Syncs code to backend safely when state values update
    useEffect(() => {
        if (syncStatus.current !== 'loaded') return;

        const postItems = async () => {
            try {
                // Posting directly to that explicit user's endpoint
                await axios.post(`${API_BASE_URL}/api/todos/${username}`, {
                    todos: todos,
                    completed: checked
                });
            } catch (error) {
                console.error("Error saving tasks:", error);
            }
        };

        postItems();
    }, [todos, checked, username]);

    // Handle switching workspaces safely
    const handleUserSwitch = () => {
        const cleanName = userInput.trim().lowerCaseOrSimilar || userInput.trim().toLowerCase();
        if (cleanName !== '') {
            syncStatus.current = 'idle'; // Reset status bar to lock posts during switch
            setUsername(cleanName);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleInputTask();
        }
    };

    const handleInputTask = () => {
        const input = document.getElementById('task-input');
        if (input.value.trim() !== '') {
            setTodos([...todos, input.value.trim()]);
        }
        input.value = '';
    };

    const handleTaskToggle = (index, marked) => {
        if (marked) {
            const task = checked[index];
            setChecked(checked.filter((_, i) => i !== index));
            setTodos([...todos, task]);
        }
        else {
            const task = todos[index];
            setTodos(todos.filter((_, i) => i !== index));
            setChecked([...checked, task]);
        }
    };

    const handleOnDragEnd = (result, listType) => {
        if (!result.destination) return;

        if (listType === 'todos') {
            const items = Array.from(todos);
            const [reorderedItem] = items.splice(result.source.index, 1);
            items.splice(result.destination.index, 0, reorderedItem);
            setTodos(items);
        } else if (listType === 'checked') {
            const items = Array.from(checked);
            const [reorderedItem] = items.splice(result.source.index, 1);
            items.splice(result.destination.index, 0, reorderedItem);
            setChecked(items);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 p-6 sm:p-12 flex flex-col items-center justify-start antialiased text-slate-800 selection:bg-blue-100">
            <div className="w-full max-w-md mb-8 text-center sm:text-left">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Task Workspace
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Active Session: <span className="font-bold text-blue-600 uppercase">{username}</span>
                </p>
            </div>

            {/* USER SWITCHER ACCORDION ELEMENT */}
            <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        className="flex-1 border border-slate-200 p-2.5 rounded-xl text-slate-900 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs font-medium"
                        placeholder="Switch username..."
                    />
                    <button
                        onClick={handleUserSwitch}
                        className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all font-semibold text-xs shadow-sm shadow-indigo-500/10"
                    >
                        Load Space
                    </button>
                </div>
            </div>

            {/* TASK INPUT FIELD */}
            <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6 transition-all hover:shadow-md">
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        onKeyDown={handleKeyDown}
                        id="task-input"
                        type="text"
                        className="flex-1 border border-slate-200 p-3 rounded-xl text-slate-900 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-sm"
                        placeholder={`Assign task to ${username}...`}
                    />
                    <button
                        onClick={handleInputTask}
                        className="bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all font-semibold text-sm shadow-sm shadow-blue-500/10"
                    >
                        Add
                    </button>
                </div>
            </div>

            <div className="w-full max-w-md space-y-6">
                {/* ACTIVE TODOS LIST */}
                {todos.length > 0 && (
                    <div className="space-y-2">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">To Do — {todos.length}</h2>
                        <DragDropContext onDragEnd={(result) => handleOnDragEnd(result, 'todos')}>
                            <Droppable droppableId="todos-list">
                                {(provided) => (
                                    <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 w-full">
                                        {todos.map((todo, index) => (
                                            <Draggable key={`todo-${todo}-${index}`} draggableId={`todo-${todo}-${index}`} index={index}>
                                                {(provided, snapshot) => (
                                                    <li
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={`flex items-center justify-between bg-white p-3.5 rounded-xl border gap-3 group transition-all cursor-grab active:cursor-grabbing ${snapshot.isDragging ? 'border-blue-500 shadow-lg scale-[1.02] ring-4 ring-blue-500/5 bg-slate-50' : 'border-slate-100 shadow-sm hover:border-slate-200'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                                            <div className="grid grid-cols-2 gap-0.5 w-2.5 opacity-40 group-hover:opacity-70 transition-opacity shrink-0">
                                                                <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                                                                <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                                                                <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                                                                <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                                                                <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                                                                <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                                                            </div>

                                                            <input
                                                                type="checkbox"
                                                                checked={false}
                                                                onChange={() => handleTaskToggle(index, false)}
                                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 accent-blue-600 cursor-pointer transition-all hover:scale-110 shrink-0"
                                                            />
                                                            <span className="text-slate-700 font-medium text-sm truncate">{todo}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => setTodos(todos.filter((_, i) => i !== index))}
                                                            className="text-slate-400 hover:text-red-500 transition-colors font-medium text-xs bg-slate-50 hover:bg-red-50 px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                        >
                                                            Delete
                                                        </button>
                                                    </li>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </ul>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </div>
                )}

                {/* COMPLETED LIST */}
                {checked.length > 0 && (
                    <div className="space-y-2">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">Completed — {checked.length}</h2>
                        <DragDropContext onDragEnd={(result) => handleOnDragEnd(result, 'checked')}>
                            <Droppable droppableId="checked-list">
                                {(provided) => (
                                    <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 w-full">
                                        {checked.map((task, index) => (
                                            <Draggable key={`checked-${task}-${index}`} draggableId={`checked-${task}-${index}`} index={index}>
                                                {(provided, snapshot) => (
                                                    <li
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={`flex items-center justify-between p-3.5 rounded-xl border gap-3 group transition-all cursor-grab active:cursor-grabbing ${snapshot.isDragging ? 'bg-slate-100 border-blue-400 shadow-md scale-[1.02]' : 'bg-slate-50/60 border-slate-100/80'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                                            <div className="grid grid-cols-2 gap-0.5 w-2.5 opacity-20 group-hover:opacity-40 transition-opacity shrink-0">
                                                                <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                                                                <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                                                                <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                                                                <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                                                                <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                                                                <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                                                            </div>

                                                            <input
                                                                type="checkbox"
                                                                checked={true}
                                                                onChange={() => handleTaskToggle(index, true)}
                                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 accent-blue-600 cursor-pointer transition-all hover:scale-110 shrink-0"
                                                            />
                                                            <span className="text-slate-400 line-through font-medium text-sm truncate">{task}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => setChecked(checked.filter((_, i) => i !== index))}
                                                            className="text-slate-400 hover:text-red-500 transition-colors font-medium text-xs bg-white hover:bg-red-50 px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 shadow-sm border border-slate-100"
                                                        >
                                                            Delete
                                                        </button>
                                                    </li>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </ul>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </div>
                )}
            </div>
        </main>
    );
}