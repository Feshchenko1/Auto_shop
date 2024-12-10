const mongoose = require('mongoose');

const managerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'manager' },
    productCategories: [{ type: String }], 
    productModels: { type: Map, of: [String] }, 
    permissions: {
        canCreate: { type: Boolean, default: false },
        canDelete: { type: Boolean, default: false }
    }
}, { collection: 'managers' }); 

module.exports = mongoose.model('Manager', managerSchema);
