import { reports } from "../config/mongoCollections.js";
import helper from './helpers.js';
import { hidePost } from './posts.js';

export const createReport = async (type, text, reported_entity, reporter) => {
    // Validations
    if (!Array.isArray(type)) throw "Type must be an array of strings";
    if (type.length === 0) throw "Type cannot be empty";
    type.forEach(t => {
        if (typeof t !== 'string' || t.trim().length === 0) throw "Type elements must be non-empty strings";
    });

    text = helper.AvailableString(text, 'report text');
    reported_entity = helper.AvailableID(reported_entity, 'reported entity ID');
    reporter = helper.AvailableID(reporter, 'reporter ID');

    // Create new report
    const newReport = {
        type,
        text,
        reported_entity,
        reporter
    };

    const reportCollection = await reports();
    const insertInfo = await reportCollection.insertOne(newReport);
    if (!insertInfo.acknowledged || !insertInfo.insertedId) throw "Could not add report";

    const newId = insertInfo.insertedId.toString();

    // Check distinct reporter count for this entity
    const uniqueReporters = await reportCollection.distinct('reporter', { reported_entity: reported_entity });

    if (uniqueReporters.length >= 20) {
        // Attempt to hide the post
        try {
            await hidePost(reported_entity);
            console.log(`Post ${reported_entity} automatically hidden due to report threshold.`);
        } catch (e) {
            // Ignore error if entity is not a post (e.g. it's a user)
            // or if it's already hidden, or other DB errors.
            // Ideally we check if it's a post first, but hidePost throws if not found.
            console.log(`Report threshold reached for ${reported_entity}, but failed to hide post (might be a user or already hidden): ${e}`);
        }
    }

    return { ...newReport, _id: insertInfo.insertedId };
}

export const getAllReports = async () => {
    const reportCollection = await reports();
    return await reportCollection.find({}).toArray();
}
