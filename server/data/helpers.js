import {ObjectId} from "mongodb";

const exportedHelpers = {
    AvailableString(inp, name) {
        if(typeof(inp) !== "string") throw `The ${name} must be a string!`;
        if (!inp) throw `You must provide an ${name}!`;
        inp = inp.trim();
        if (inp.length === 0) throw `The ${name} cannot be an empty string or just spaces!`;

        return inp;
    },

    AvailableID(id, name) {
        this.AvailableString(id, name);
        if(!ObjectId.isValid(id)) throw `Invalid ${name}!`;
        return id.trim();
    },

    AvailableObj(obj, name) {
        if(!obj) throw `You must provide an ${name}!`;
        if(typeof obj !== 'object' || obj === null || Array.isArray(obj)) throw `The ${name} must be an object!`
    }
}

export default exportedHelpers;