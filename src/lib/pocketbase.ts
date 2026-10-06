import PocketBase from 'pocketbase';

// In a real environment, this should be an environment variable.
// For the MVP, we assume a local or test instance.
const POCKETBASE_URL = 'http://127.0.0.1:8090';

export const pb = new PocketBase(POCKETBASE_URL);
