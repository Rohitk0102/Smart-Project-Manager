const http = require('http');

const makeRequest = (path, method, body) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5005,
            path: `/api/auth${path}`,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({ statusCode: res.statusCode, body: JSON.parse(data || '{}') });
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
    console.log('Starting Auth Tests...');

    // Test 1: Signup with invalid email
    console.log('\nTest 1: Signup with invalid email');
    try {
        const res1 = await makeRequest('/signup', 'POST', {
            name: 'Test User',
            email: 'invalid-email',
            password: 'password123',
        });
        console.log('Status:', res1.statusCode);
        console.log('Body:', res1.body);
        if (res1.statusCode === 400 && res1.body.message === 'Invalid email format') {
            console.log('✅ Passed');
        } else {
            console.log('❌ Failed');
        }
    } catch (e) {
        console.log('❌ Failed (Error):', e.message);
    }

    // Test 2: Signup with valid email
    const uniqueEmail = `testuser_${Date.now()}@example.com`;
    console.log(`\nTest 2: Signup with valid email (${uniqueEmail})`);
    try {
        const res2 = await makeRequest('/signup', 'POST', {
            name: 'Test User',
            email: uniqueEmail,
            password: 'password123',
        });
        console.log('Status:', res2.statusCode);
        // console.log('Body:', res2.body);
        if (res2.statusCode === 201 && res2.body.token) {
            console.log('✅ Passed');
        } else {
            console.log('❌ Failed');
        }
    } catch (e) {
        console.log('❌ Failed (Error):', e.message);
    }

    // Test 3: Login with correct credentials
    console.log('\nTest 3: Login with correct credentials');
    try {
        const res3 = await makeRequest('/login', 'POST', {
            email: uniqueEmail,
            password: 'password123',
        });
        console.log('Status:', res3.statusCode);
        if (res3.statusCode === 200 && res3.body.token) {
            console.log('✅ Passed');
        } else {
            console.log('❌ Failed');
        }
    } catch (e) {
        console.log('❌ Failed (Error):', e.message);
    }

    // Test 4: Login with incorrect password
    console.log('\nTest 4: Login with incorrect password');
    try {
        const res4 = await makeRequest('/login', 'POST', {
            email: uniqueEmail,
            password: 'wrongpassword',
        });
        console.log('Status:', res4.statusCode);
        if (res4.statusCode === 401) {
            console.log('✅ Passed');
        } else {
            console.log('❌ Failed');
        }
    } catch (e) {
        console.log('❌ Failed (Error):', e.message);
    }
};

runTests();
