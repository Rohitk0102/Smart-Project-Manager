const http = require('http');

let authToken = '';
const BASE_URL = 'http://localhost:5005/api';

const makeRequest = (path, method, body, token) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5005,
            path: `/api${path}`,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
            },
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    resolve({ statusCode: res.statusCode, body: JSON.parse(data || '{}') });
                } catch (e) {
                    // console.log("Failed to parse", data);
                    resolve({ statusCode: res.statusCode, body: {} });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
};

const runTests = async () => {
    console.log('Starting Full System Tests...');

    // 1. Login to get token
    console.log('\n1. Logging in...');
    // Create user if not exists (or use one from previous run)
    const email = `testuser_${Date.now()}@example.com`;
    // Register first
    await makeRequest('/auth/signup', 'POST', {
        name: 'Test Manager',
        email: email,
        password: 'password123',
    });

    // Login
    const loginRes = await makeRequest('/auth/login', 'POST', {
        email: email,
        password: 'password123',
    });

    if (loginRes.statusCode === 200 && loginRes.body.token) {
        authToken = loginRes.body.token;
        console.log('✅ Login Successful');
    } else {
        console.error('❌ Login Failed', loginRes.statusCode, loginRes.body);
        process.exit(1);
    }

    // 2. Create Project
    console.log('\n2. Creating Project...');
    let projectId = '';
    const projRes = await makeRequest('/projects', 'POST', {
        name: 'AI Project',
        description: 'Testing AI integration',
        deadline: new Date(),
        members: []
    }, authToken);

    if (projRes.statusCode === 201) {
        projectId = projRes.body._id;
        console.log('✅ Project Created:', projectId);
    } else {
        console.error('❌ Project Creation Failed', projRes.statusCode);
    }

    // 3. Create Task
    console.log('\n3. Creating Task...');
    const taskRes = await makeRequest('/tasks', 'POST', {
        title: 'Implement Neural Net',
        description: 'Build a transformer model',
        priority: 'high',
        project: projectId,
        status: 'todo',
        dueDate: new Date()
    }, authToken);

    if (taskRes.statusCode === 201) {
        console.log('✅ Task Created');
    } else {
        console.error('❌ Task Creation Failed', taskRes.statusCode);
    }

    // 4. Test AI Integration (Mock check via backend proxy)
    // Note: This relies on the Python service running.
    console.log('\n4. Testing AI Analysis endpoint...');
    const aiRes = await makeRequest('/tasks/analyze', 'POST', {
        description: 'Build a complex react application with redux'
    }, authToken);

    if (aiRes.statusCode === 200) {
        console.log('✅ AI Service Responded');
        console.log('Insight:', aiRes.body.insight ? 'Received' : 'Empty');
    } else {
        console.log('⚠️ AI Service Failed (Status ' + aiRes.statusCode + ') - Is Python service running?');
    }
};

runTests();
