const { google } = require('googleapis');
const admin = require('firebase-admin');
const functions = require('firebase-functions');

admin.initializeApp();

const projectId = process.env.GCP_PROJECT;
const service = google.firebase('v1beta1');

// Disable Firestore on budget exceed
exports.disableFirestoreOnBudget = functions.pubsub
  .topic('your-topic-id')
  .onPublish(async () => {
    await toggleFirestoreState('DISABLED');
  });

// HTTP trigger to manually enable Firestore
exports.enableFirestoreManually = functions.https.onRequest(async (req, res) => {
  try {
    await toggleFirestoreState('ENABLED');
    res.status(200).send('Firestore re-enabled successfully.');
  } catch (error) {
    res.status(500).send(`Error enabling Firestore: ${error.message}`);
  }
});

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
