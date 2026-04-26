const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    status: {
        type: String,
        enum: ['to-do', 'running', 'completed'],
        default: 'to-do',
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium',
    },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dueDate: { type: Date },
    attachments: [{ type: String }], // URLs to files
    order: { type: Number, default: 0 },
}, { timestamps: true });

const Task = mongoose.model('Task', taskSchema);
module.exports = Task;
