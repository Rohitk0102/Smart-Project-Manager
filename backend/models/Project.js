const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedLeads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    assignedEmployees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    deadline: { type: Date },
    status: {
        type: String,
        enum: ['upcoming', 'active', 'completed'],
        default: 'active'
    },
    progressMode: {
        type: String,
        enum: ['Auto', 'Manual'],
        default: 'Auto'
    },
    manualProgress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    progressSuggestions: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        suggestedPercent: { type: Number, required: true },
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        timestamp: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;
