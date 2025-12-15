import { reports } from "../config/mongoCollections.js";
import helper from './helpers.js';
import { hidePost, hideAllPostsByUser } from './posts.js';
import { hideUser } from './users.js';

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
        // Attempt to hide the post or user
        try {
            // First try to hide as a post
            await hidePost(reported_entity);
            console.log(`Post ${reported_entity} automatically hidden due to report threshold.`);
        } catch (e) {
            // If hiding post failed, try to hide as a user
            try {
                await hideUser(reported_entity);
                await hideAllPostsByUser(reported_entity);
                console.log(`User ${reported_entity} and their posts automatically hidden due to report threshold.`);
            } catch (userError) {
                console.log(`Report threshold reached for ${reported_entity}, but failed to hide (not a post or user, or already hidden)`);
            }
        }
    }

    return { ...newReport, _id: insertInfo.insertedId };
}

export const getAllReports = async () => {
    const reportCollection = await reports();
    return await reportCollection.find({}).toArray();
}
