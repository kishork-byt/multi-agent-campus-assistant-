const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const CommunityPost = require("../models/CommunityPost");
const CommunityComment = require("../models/CommunityComment");
const SupportIssue = require("../models/SupportIssue");
const AiModerationService = require("../services/aiModerationService");
const { isDbConnected, inMemoryCommunityPosts, inMemoryCommunityComments, inMemorySupportIssues } = require("../services/inMemoryStore");

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
    if (isDbConnected()) {
      const filter = {};
      if (req.query.category && req.query.category !== 'all') {
        filter.category = new RegExp(`^${req.query.category}$`, 'i');
      }
      if (req.query.status) {
        filter.status = req.query.status;
      }
      const posts = await CommunityPost.find(filter).sort({ createdAt: -1 });
      return res.json({ success: true, count: posts.length, data: posts });
    } else {
      let posts = [...inMemoryCommunityPosts];
      if (req.query.category && req.query.category !== 'all') {
        posts = posts.filter(p => (p.category || "").toLowerCase() === req.query.category.toLowerCase());
      }
      if (req.query.status) {
        posts = posts.filter(p => p.status === req.query.status);
      }
      return res.json({ success: true, count: posts.length, data: posts });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/community/posts/:id - Get single post
router.get("/posts/:id", async (req, res) => {
  try {
    const idParam = req.params.id;
    if (isDbConnected()) {
      const post = await CommunityPost.findOne(getPostQuery(idParam));
      if (!post) return res.status(404).json({ success: false, error: "Community post not found" });
      return res.json({ success: true, data: post });
    } else {
      const post = inMemoryCommunityPosts.find(p => p._id === idParam || p.postId === idParam);
      if (!post) return res.status(404).json({ success: false, error: "Community post not found" });
      return res.json({ success: true, data: post });
    }
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
      anonymousHandle: req.body.anonymousHandle || "OceanSoul",
      status: aiResult.status,
      toxicScore: aiResult.toxicScore,
      fakeScore: aiResult.fakeScore,
      duplicateScore: aiResult.duplicateScore,
      flagReason: aiResult.flagReason,
      linkedPostId: aiResult.linkedPostId
    };

    let post;
    if (isDbConnected()) {
      post = new CommunityPost(postData);
      await post.save();
    } else {
      post = {
        _id: "post_" + Date.now(),
        postId: postData.postId || "post_" + Date.now(),
        authorRole: postData.authorRole || "student",
        anonymousHandle: postData.anonymousHandle || "OceanSoul",
        category: postData.category || "General",
        text: postData.text || "",
        mediaType: postData.mediaType || "none",
        mediaUrl: postData.mediaUrl || "",
        postType: postData.postType || "text",
        pollData: postData.pollData || null,
        eventData: postData.eventData || null,
        timestamp: postData.timestamp || "Just now",
        supportCount: postData.supportCount || 0,
        supportedBy: postData.supportedBy || [],
        status: postData.status,
        toxicScore: postData.toxicScore,
        fakeScore: postData.fakeScore,
        duplicateScore: postData.duplicateScore,
        flagReason: postData.flagReason,
        linkedPostId: postData.linkedPostId,
        createdAt: new Date().toISOString()
      };
      inMemoryCommunityPosts.unshift(post);
    }
    res.status(201).json({ success: true, data: post, aiModeration: aiResult });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PUT /api/community/posts/:id - Moderate or update post
router.put("/posts/:id", async (req, res) => {
  try {
    const idParam = req.params.id;
    if (isDbConnected()) {
      const post = await CommunityPost.findOneAndUpdate(getPostQuery(idParam), { $set: req.body }, { new: true, runValidators: true });
      if (!post) return res.status(404).json({ success: false, error: "Community post not found" });
      return res.json({ success: true, data: post });
    } else {
      const post = inMemoryCommunityPosts.find(p => p._id === idParam || p.postId === idParam);
      if (!post) return res.status(404).json({ success: false, error: "Community post not found" });
      Object.assign(post, req.body);
      return res.json({ success: true, data: post });
    }
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/community/posts/:id - Delete post
router.delete("/posts/:id", async (req, res) => {
  try {
    const idParam = req.params.id;
    if (isDbConnected()) {
      const post = await CommunityPost.findOneAndDelete(getPostQuery(idParam));
      if (!post) return res.status(404).json({ success: false, error: "Community post not found" });
      const targetId = post.postId || post._id.toString();
      await CommunityComment.deleteMany({ $or: [{ postId: targetId }, { postId: idParam }] });
      await SupportIssue.deleteMany({ $or: [{ postId: targetId }, { postId: idParam }] });
      return res.json({ success: true, message: "Community post and associated records removed successfully" });
    } else {
      const idx = inMemoryCommunityPosts.findIndex(p => p._id === idParam || p.postId === idParam);
      if (idx === -1) return res.status(404).json({ success: false, error: "Community post not found" });
      const removed = inMemoryCommunityPosts.splice(idx, 1)[0];
      const targetId = removed.postId || removed._id;
      for (let i = inMemoryCommunityComments.length - 1; i >= 0; i--) {
        if (inMemoryCommunityComments[i].postId === targetId || inMemoryCommunityComments[i].postId === idParam) {
          inMemoryCommunityComments.splice(i, 1);
        }
      }
      for (let i = inMemorySupportIssues.length - 1; i >= 0; i--) {
        if (inMemorySupportIssues[i].postId === targetId || inMemorySupportIssues[i].postId === idParam) {
          inMemorySupportIssues.splice(i, 1);
        }
      }
      return res.json({ success: true, message: "Community post and associated records removed successfully" });
    }
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
    if (isDbConnected()) {
      const filter = {};
      if (req.query.postId) filter.postId = req.query.postId;
      const comments = await CommunityComment.find(filter).sort({ createdAt: 1 });
      return res.json({ success: true, count: comments.length, data: comments });
    } else {
      let comments = inMemoryCommunityComments;
      if (req.query.postId) {
        comments = inMemoryCommunityComments.filter(c => c.postId === req.query.postId);
      }
      return res.json({ success: true, count: comments.length, data: comments });
    }
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

    let comment;
    if (isDbConnected()) {
      comment = new CommunityComment(commentData);
      await comment.save();
    } else {
      comment = {
        _id: "comment_" + Date.now(),
        postId: commentData.postId,
        authorRole: commentData.authorRole || "student",
        text: commentData.text || "",
        timestamp: commentData.timestamp || "Just now",
        isFlagged: commentData.isFlagged,
        flagReason: commentData.flagReason,
        createdAt: new Date().toISOString()
      };
      inMemoryCommunityComments.push(comment);
    }
    res.status(201).json({ success: true, data: comment, aiModeration: aiAnalysis });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/community/comments/:id - Delete comment
router.delete("/comments/:id", async (req, res) => {
  try {
    const idParam = req.params.id;
    if (isDbConnected()) {
      const comment = await CommunityComment.findByIdAndDelete(idParam);
      if (!comment) return res.status(404).json({ success: false, error: "Comment not found" });
      return res.json({ success: true, message: "Comment deleted successfully" });
    } else {
      const idx = inMemoryCommunityComments.findIndex(c => c._id === idParam);
      if (idx === -1) return res.status(404).json({ success: false, error: "Comment not found" });
      inMemoryCommunityComments.splice(idx, 1);
      return res.json({ success: true, message: "Comment deleted successfully" });
    }
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

    if (isDbConnected()) {
      const post = await CommunityPost.findOne(getPostQuery(postId));
      if (!post) return res.status(404).json({ success: false, error: "Community post not found" });

      const targetPostId = post.postId || post._id.toString();
      const existing = await SupportIssue.findOne({ postId: { $in: [postId, targetPostId] }, userId });
      let isSupported = false;

      if (existing) {
        await SupportIssue.findByIdAndDelete(existing._id);
        post.supportedBy = (post.supportedBy || []).filter(u => u !== userId);
        post.supportCount = Math.max(0, post.supportCount - 1);
      } else {
        const supportDoc = new SupportIssue({ postId: targetPostId, userId, userRole: userRole || 'student' });
        await supportDoc.save();
        if (!post.supportedBy) post.supportedBy = [];
        post.supportedBy.push(userId);
        post.supportCount = (post.supportCount || 0) + 1;
        isSupported = true;
      }

      await post.save();
      return res.json({ success: true, isSupported, supportCount: post.supportCount, data: post });
    } else {
      const post = inMemoryCommunityPosts.find(p => p._id === postId || p.postId === postId);
      if (!post) return res.status(404).json({ success: false, error: "Community post not found" });

      const targetPostId = post.postId || post._id;
      const existingIdx = inMemorySupportIssues.findIndex(s => (s.postId === postId || s.postId === targetPostId) && s.userId === userId);
      let isSupported = false;

      if (existingIdx !== -1) {
        inMemorySupportIssues.splice(existingIdx, 1);
        post.supportedBy = (post.supportedBy || []).filter(u => u !== userId);
        post.supportCount = Math.max(0, (post.supportCount || 0) - 1);
      } else {
        inMemorySupportIssues.push({ _id: "sup_" + Date.now(), postId: targetPostId, userId, userRole: userRole || 'student' });
        if (!post.supportedBy) post.supportedBy = [];
        post.supportedBy.push(userId);
        post.supportCount = (post.supportCount || 0) + 1;
        isSupported = true;
      }

      return res.json({ success: true, isSupported, supportCount: post.supportCount, data: post });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* -------------------------------------------------------------------------- */
/* 4. POLL VOTING & POST REPORTING ENDPOINTS                                  */
/* -------------------------------------------------------------------------- */

// POST /api/community/poll/vote - Vote on a poll post
router.post("/poll/vote", async (req, res) => {
  try {
    const { postId, optionIndex, userId } = req.body;
    if (!postId || optionIndex === undefined || !userId) {
      return res.status(400).json({ success: false, error: "postId, optionIndex, and userId are required" });
    }

    if (isDbConnected()) {
      const post = await CommunityPost.findOne(getPostQuery(postId));
      if (!post) return res.status(404).json({ success: false, error: "Community post not found" });

      if (post.pollData && post.pollData.options && post.pollData.options[optionIndex]) {
        // Prevent duplicate voting from same user session
        post.pollData.options.forEach(opt => {
          if (opt.voters && opt.voters.includes(userId)) {
            opt.voters = opt.voters.filter(u => u !== userId);
            opt.votes = Math.max(0, opt.votes - 1);
          }
        });

        const targetOption = post.pollData.options[optionIndex];
        if (!targetOption.voters) targetOption.voters = [];
        targetOption.voters.push(userId);
        targetOption.votes = (targetOption.votes || 0) + 1;

        post.markModified("pollData");
        await post.save();
        return res.json({ success: true, data: post });
      }
      return res.status(400).json({ success: false, error: "Invalid poll option index" });
    } else {
      const post = inMemoryCommunityPosts.find(p => p._id === postId || p.postId === postId);
      if (!post) return res.status(404).json({ success: false, error: "Community post not found" });

      if (post.pollData && post.pollData.options && post.pollData.options[optionIndex]) {
        post.pollData.options.forEach(opt => {
          if (opt.voters && opt.voters.includes(userId)) {
            opt.voters = opt.voters.filter(u => u !== userId);
            opt.votes = Math.max(0, opt.votes - 1);
          }
        });

        const targetOption = post.pollData.options[optionIndex];
        if (!targetOption.voters) targetOption.voters = [];
        targetOption.voters.push(userId);
        targetOption.votes = (targetOption.votes || 0) + 1;

        return res.json({ success: true, data: post });
      }
      return res.status(400).json({ success: false, error: "Invalid poll option index" });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/community/report - Report an anonymous post
router.post("/report", async (req, res) => {
  try {
    const { postId, reason, details, userId } = req.body;
    if (!postId || !reason) {
      return res.status(400).json({ success: false, error: "postId and reason are required" });
    }

    const flagMsg = `Reported by User (${reason})${details ? ': ' + details : ''}`;
    if (isDbConnected()) {
      const post = await CommunityPost.findOneAndUpdate(
        getPostQuery(postId),
        { $set: { status: 'flagged', flagReason: flagMsg } },
        { new: true }
      );
      if (!post) return res.status(404).json({ success: false, error: "Community post not found" });
      return res.json({ success: true, message: "Report submitted successfully to AI Moderation", data: post });
    } else {
      const post = inMemoryCommunityPosts.find(p => p._id === postId || p.postId === postId);
      if (!post) return res.status(404).json({ success: false, error: "Community post not found" });
      post.status = 'flagged';
      post.flagReason = flagMsg;
      return res.json({ success: true, message: "Report submitted successfully to AI Moderation", data: post });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
