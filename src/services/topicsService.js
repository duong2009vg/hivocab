// Topic domain boundary.
// The implementation remains in db.js for backward compatibility with legacy
// consumers, while new topic-related code should import from this module.
export {
  clearTopicCache,
  getCachedTopics,
  getTopics,
  isUserPro,
  createTopic,
  deleteTopic,
  deleteTopicCascade,
  deleteFolderCascade,
} from "./db.js";
