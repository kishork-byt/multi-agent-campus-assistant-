const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const CommunityPost = require("../models/CommunityPost");
const CommunityComment = require("../models/CommunityComment");
const SupportIssue = require("../models/SupportIssue");
const AiModerationService = require("../services/aiModerationService");

// Helper to construct query for _id or postId
function getPostQuery(id) {
  return mongoose.Types.ObjectId.isValid(id) ? { $or: [{ _id: id }, { postId: id }] } : { postId: id };
}

/* -------------------------------------------------------------------------- */
/* 1. COMMUNITY POSTS CRUD & MODERATION                                       */
/* -------------------------------------------------------------------------- */

// GET /api/community/posts - List posts
router.get("/posts", async (req, res) => {
  try {
    const filter = {};
    if (req.query.category && req.query.category !== 'all') {
      filter.category = new RegExp(`^${req.query.category}$`, 'i');
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }
    const posts = await CommunityPost.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: posts.length, data: posts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/community/posts/:id - Get single post
router.get("/posts/:id", async (req, res) => {
  try {
    const post = await CommunityPost.findOne(getPostQuery(req.params.id));
    if (!post) return res.status(404).json({ success: false, error: "Community post not found" });
    res.json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/community/posts - Create post with AI Moderation
router.post("/posts", async (req, res) => {
  try {
    const aiResult = await AiModerationService.analyzePost(req.body);
    const postData = {
      ...req.body,
      status: aiResult.status,
      toxicScore: aiResult.toxicScore,
      fakeScore: aiResult.fakeScore,
      duplicateScore: aiResult.duplicateScore,
      flagReason: aiResult.flagReason,
      linkedPostId: aiResult.linkedPostId
    };
    const post = new CommunityPost(postData);
    await post.save();
    res.status(201).json({ success: true, data: post, aiModeration: aiResult });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PUT /api/community/posts/:id - Moderate or update post
router.put("/posts/:id", async (req, res) => {
  try {
    const post = await CommunityPost.findOneAndUpdate(getPostQuery(req.params.id), { $set: req.body }, { new: true, runValidators: true });
    if (!post) return res.status(404).json({ success: false, error: "Community post not found" });
    res.json({ success: true, data: post });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/community/posts/:id - Delete post
router.delete("/posts/:id", async (req, res) => {
  try {
    const post = await CommunityPost.findOneAndDelete(getPostQuery(req.params.id));
    if (!post) return res.status(404).json({ success: false, error: "Community post not found" });
    const targetId = post.postId || post._id.toString();
    await CommunityComment.deleteMany({ $or: [{ postId: targetId }, { postId: req.params.id }] });
    await SupportIssue.deleteMany({ $or: [{ postId: targetId }, { postId: req.params.id }] });
    res.json({ success: true, message: "Community post and associated records removed successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* -------------------------------------------------------------------------- */
/* 2. COMMUNITY COMMENTS CRUD                                                 */
/* -------------------------------------------------------------------------- */

// GET /api/community/comments - Get comments for a post (?postId=...)
router.get("/comments", async (req, res) => {
  try {
    const filter = {};
    if (req.query.postId) filter.postId = req.query.postId;
    const comments = await CommunityComment.find(filter).sort({ createdAt: 1 });
    res.json({ success: true, count: comments.length, data: comments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/community/comments - Add comment with AI Moderation
router.post("/comments", async (req, res) => {
  try {
    const aiAnalysis = AiModerationService.analyzeComment(req.body);
    const commentData = {
      ...req.body,
      isFlagged: aiAnalysis.isFlagged,
      flagReason: aiAnalysis.flagReason
    };
    const comment = new CommunityComment(commentData);
    await comment.save();
    res.status(201).json({ success: true, data: comment, aiModeration: aiAnalysis });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/community/comments/:id - Delete comment
router.delete("/comments/:id", async (req, res) => {
  try {
    const comment = await CommunityComment.findByIdAndDelete(req.params.id);
    if (!comment) return res.status(404).json({ success: false, error: "Comment not found" });
    res.json({ success: true, message: "Comment deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* -------------------------------------------------------------------------- */
/* 3. COMMUNITY SUPPORT ISSUES CRUD                                           */
/* -------------------------------------------------------------------------- */

// POST /api/community/support - Support/Unsupport an issue
router.post("/support", async (req, res) => {
  try {
    const { postId, userId, userRole } = req.body;
    if (!postId || !userId) {
      return res.status(400).json({ success: false, error: "postId and userId are required" });
    }

    const post = await CommunityPost.findOne(getPostQuery(postId));
    if (!post) return res.status(404).json({ success: false, error: "Community post not found" });

    const targetPostId = post.postId || post._id.toString();
    const existing = await SupportIssue.findOne({ postId: { $in: [postId, targetPostId] }, userId });
    let isSupported = false;

    if (existing) {
      // Toggle off support
      await SupportIssue.findByIdAndDelete(existing._id);
      post.supportedBy = (post.supportedBy || []).filter(u => u !== userId);
      post.supportCount = Math.max(0, post.supportCount - 1);
    } else {
      // Toggle on support
      const supportDoc = new SupportIssue({ postId: targetPostId, userId, userRole: userRole || 'student' });
      await supportDoc.save();
      if (!post.supportedBy) post.supportedBy = [];
      post.supportedBy.push(userId);
      post.supportCount = (post.supportCount || 0) + 1;
      isSupported = true;
    }

    await post.save();
    res.json({ success: true, isSupported, supportCount: post.supportCount, data: post });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/community/support - List all support issue logs
router.get("/support", async (req, res) => {
  try {
    const logs = await SupportIssue.find().sort({ createdAt: -1 });
    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
