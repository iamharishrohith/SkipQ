
async function verifyBranch() {
    const branchId = '0f5e545e-ba45-478e-9aa3-b1c5ec300cd6';
    try {
        console.log(`Testing /api/org/branches/${branchId}...`);
        const res = await fetch(`http://localhost:3001/api/org/branches/${branchId}`);
        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Data:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error:', err);
    }
}

verifyBranch();
