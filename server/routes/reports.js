import { Router } from 'express';
import { createReport } from '../data/reports.js';
import helper from '../data/helpers.js';

const router = Router();

router.post('/', async (req, res) => {
    // Check if user is logged in
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'You must be logged in to report.' });
    }

    const { type, text, reported_entity } = req.body;

    // Validation
    try {
        if (!type || !Array.isArray(type) || type.length === 0) throw "Type must be a non-empty array of strings.";
        type.forEach(t => {
            if (typeof t !== 'string' || t.trim().length === 0) throw "Type elements must be non-empty strings.";
        });

        helper.AvailableString(text, 'report text');
        helper.AvailableID(reported_entity, 'reported entity ID');
    } catch (e) {
        return res.status(400).json({ error: e });
    }

    const reporter = req.session.user._id.toString();

    try {
        const report = await createReport(type, text, reported_entity, reporter);
        res.status(201).json(report);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
