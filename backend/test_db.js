require('dotenv').config();
const mongoose = require('mongoose');

const srvUri = 'mongodb+srv://admin:inithan@cluster0.ledihjb.mongodb.net/inithan_gifts?appName=Cluster0';
const standardUri = 'mongodb://admin:inithan@ac-3unkjrx-shard-00-00.ledihjb.mongodb.net:27017,ac-3unkjrx-shard-00-01.ledihjb.mongodb.net:27017,ac-3unkjrx-shard-00-02.ledihjb.mongodb.net:27017/inithan_gifts?ssl=true&replicaSet=atlas-k1g5zj-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

async function testConnection(u, label) {
    try {
        console.log(`Testing ${label} connection...`);
        await mongoose.connect(u, { serverSelectionTimeoutMS: 15000 });
        console.log(`✅ Success for ${label}!`);
        await mongoose.disconnect();
        return true;
    } catch (err) {
        console.log(`❌ Failed: ${err.message}`);
        return false;
    }
}

async function run() {
    console.log("Starting tests...");
    let ok = await testConnection(srvUri, 'SRV');
    if (!ok) {
        await testConnection(standardUri, 'Standard');
    }
    process.exit();
}
run();
