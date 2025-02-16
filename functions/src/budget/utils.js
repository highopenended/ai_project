const { google } = require('googleapis');
const admin = require('firebase-admin');

// Initialize admin only if it hasn't been initialized yet
if (!admin.apps.length) {
    admin.initializeApp();
}

const projectId = process.env.GCP_PROJECT;
const service = google.firebase('v1beta1');

async function toggleFirestoreState(state) {
    try {
        const auth = await google.auth.getClient({
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });

        google.options({ auth });

        await service.projects.databases.patch({
            name: `projects/${projectId}/databases/(default)`,
            updateMask: 'state',
            requestBody: { state },
        });

        console.log(`Firestore successfully set to ${state}.`);
    } catch (err) {
        console.error(`Error setting Firestore state to ${state}:`, err);
        throw err;
    }
}

module.exports = {
    toggleFirestoreState
}; 