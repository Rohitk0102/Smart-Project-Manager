import { useState, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import api from '../api';
import './CalendarStyles.css'; // We will create this for custom dark mode styling
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const locales = {
    'en-US': enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const Calendar = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                // Reuse the 'my-tasks' endpoint which fetches all tasks for the user
                const { data } = await api.get('/tasks/my-tasks');

                const calendarEvents = data
                    .filter(task => task.dueDate) // Only tasks with due dates
                    .map(task => ({
                        id: task._id,
                        title: task.title,
                        start: new Date(task.dueDate),
                        end: new Date(new Date(task.dueDate).getTime() + 60 * 60 * 1000), // Default 1 hour duration
                        allDay: false,
                        resource: task,
                    }));

                setEvents(calendarEvents);
            } catch (error) {
                console.error("Failed to fetch calendar tasks", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, []);

    const handleSelectEvent = (event) => {
        if (event.resource.project && event.resource.project._id) {
            navigate(`/project/${event.resource.project._id}`);
        }
    };

    const eventStyleGetter = (event) => {
        const priorityColor = event.resource.priority === 'high' ? '#ef4444' :
            event.resource.priority === 'medium' ? '#f97316' : '#3b82f6';

        return {
            style: {
                backgroundColor: priorityColor,
                borderRadius: '6px',
                opacity: 0.9,
                color: 'white',
                border: '0px',
                display: 'block',
                fontSize: '0.85em',
                padding: '4px 8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }
        };
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1 h-full bg-[#0a0f1c] text-white p-6 overflow-hidden flex flex-col"
        >
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                        Calendar
                    </h1>
                    <p className="text-slate-400 mt-1">Manage your schedule and deadlines</p>
                </div>
            </header>

            <div className="flex-1 bg-dark-card rounded-xl border border-slate-800 p-4 shadow-xl overflow-hidden relative">
                {loading ? (
                    <div className="h-full flex items-center justify-center text-slate-500">
                        <div className="animate-pulse flex flex-col items-center">
                            <div className="h-4 w-32 bg-slate-800 rounded mb-4"></div>
                            <div className="h-64 w-full bg-slate-800/50 rounded"></div>
                        </div>
                    </div>
                ) : (
                    <BigCalendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        eventPropGetter={eventStyleGetter}
                        views={['month', 'week', 'day', 'agenda']}
                        defaultView="month"
                        popup
                        onSelectEvent={handleSelectEvent}
                        messages={{
                            next: "Next",
                            previous: "Back",
                            today: "Today",
                            month: "Month",
                            week: "Week",
                            day: "Day"
                        }}
                    />
                )}
            </div>
        </motion.div>
    );
};

export default Calendar;
