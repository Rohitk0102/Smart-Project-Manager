const axios = require('axios');
const Project = require('../models/Project');

// @desc    Handle AI Chat Proxy to Anthropic
// @route   POST /api/ai/chat
// @access  Private
const handleChat = async (req, res) => {
    const { messages, projectContext } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ reply: 'Messages array is required' });
    }

    try {
        let projectName = projectContext?.name || 'General Workspace';
        let projectDesc = projectContext?.description || 'N/A';
        
        const systemPrompt = `You are a project management assistant. The current user is a ${req.user.role}. They are working on the project '${projectName}'. Project description: ${projectDesc}. Help with task planning, project descriptions, and status updates appropriate to their role. Keep responses concise and helpful.`;

        // If ANTHROPIC_API_KEY is not in env, we gracefully degrade or return an error.
        if (!process.env.ANTHROPIC_API_KEY) {
             return res.status(500).json({ reply: 'Server missing Anthropic API configuration.' });
        }

        const payload = {
            model: "claude-3-5-sonnet-20240620", // Standard model or use claude-3-haiku
            max_tokens: 1024,
            system: systemPrompt,
            messages: messages.map(m => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.text
            }))
        };

        const response = await axios.post('https://api.anthropic.com/v1/messages', payload, {
            headers: {
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            }
        });

        const replyContent = response.data.content[0].text;
        
        res.json({ reply: replyContent });
    } catch (error) {
        console.error("Anthropic API Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ reply: 'I encountered an error. Please try again.' });
    }
};

module.exports = { handleChat };