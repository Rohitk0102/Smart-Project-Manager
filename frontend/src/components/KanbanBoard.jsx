import { useState } from 'react';
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableItem = ({ id, content }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

    conststyle = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={conststyle} {...attributes} {...listeners} className="bg-slate-700 p-3 mb-2 rounded shadow-sm border border-slate-600 cursor-grab active:cursor-grabbing">
            {content}
        </div>
    );
};

const Column = ({ id, tasks }) => {
    return (
        <div className="bg-slate-800 rounded-lg p-4 w-72 flex-shrink-0 border border-slate-700">
            <h3 className="font-bold mb-4 text-slate-300 capitalize">{id.replace('_', ' ')}</h3>
            <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
                {tasks.map((task) => (
                    <SortableItem key={task.id} id={task.id} content={task.content} />
                ))}
            </SortableContext>
        </div>
    );
};

const KanbanBoard = () => {
    // Mock Data
    const [tasks, setTasks] = useState({
        todo: [
            { id: '1', content: 'Research Competitors' },
            { id: '2', content: 'Draft Requirements' },
        ],
        in_progress: [
            { id: '3', content: 'Setup Repo' },
        ],
        done: [
            { id: '4', content: 'Initial Kickoff' },
        ]
    });

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (!over) return;

        // Simple implementation for drag and drop within same column for demo
        // Full implementation needs logic to move between columns (containers)
        console.log("Dragged", active.id, "to", over.id);
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
            <div className="flex space-x-4 overflow-x-auto p-4 items-start h-full">
                {Object.keys(tasks).map((columnId) => (
                    <Column key={columnId} id={columnId} tasks={tasks[columnId]} />
                ))}
            </div>
        </DndContext>
    );
};

export default KanbanBoard;
