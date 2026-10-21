import { computeWorldFields } from './world-preparation.js';
self.onmessage = ({data}) => {
    try { self.postMessage({result:computeWorldFields(data.type, data.data)}); }
    catch (error) { self.postMessage({error:error.message}); }
};
