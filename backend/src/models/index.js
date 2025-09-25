const User = require('./User');
const WasteType = require('./WasteType');
const Comment = require('./Comment');

// Associations
User.hasMany(WasteType, { foreignKey: 'created_by' });
WasteType.belongsTo(User, { foreignKey: 'created_by' });

User.hasMany(Comment, { foreignKey: 'responded_by' });
Comment.belongsTo(User, { foreignKey: 'responded_by' });

module.exports = {
  User,
  WasteType,
  Comment
};
