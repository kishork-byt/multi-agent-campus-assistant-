const Announcement = require("../models/Announcement");
const Notification = require("../models/Notification");
const mongoose = require("mongoose");

const isDbConnected = () => mongoose.connection.readyState === 1;

const inMemoryAnnouncements = [];
const inMemoryNotifications = [];
const inMemoryCommunityPosts = [];
const inMemoryCommunityComments = [];
const inMemorySupportIssues = [];

async function createNotificationForAnnouncement(announcement) {
  const targetLower = (announcement.target || "").toLowerCase();
  const notifTitle = announcement.title;
  const notifDesc = `[${announcement.priority || "Normal"} Priority] Broadcast Announcement from ${announcement.author || "System Administrator"}`;
  const notifTime = announcement.date || new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  const relatedId = announcement.announcementId || (announcement._id ? announcement._id.toString() : null);

  const targetsStudent = targetLower.includes('all') || targetLower.includes('student');
  const targetsStaff = targetLower.includes('all') || targetLower.includes('staff') || targetLower.includes('faculty');

  const createdNotifs = [];

  if (targetsStudent) {
    const studentData = {
      role: 'student',
      type: 'Academic',
      title: notifTitle,
      desc: notifDesc,
      time: notifTime,
      read: false,
      relatedId: relatedId
    };
    if (isDbConnected()) {
      try {
        const existing = await Notification.findOne({ relatedId: relatedId, role: 'student' });
        if (!existing) {
          const n = await Notification.create(studentData);
          createdNotifs.push(n);
        } else {
          createdNotifs.push(existing);
        }
      } catch (e) {
        console.warn("DB notification creation warning:", e.message);
      }
    } else {
      const existing = inMemoryNotifications.find(n => n.relatedId === relatedId && n.role === 'student');
      if (!existing) {
        const n = { _id: "notif_" + Date.now() + "_stu", ...studentData, createdAt: new Date().toISOString() };
        inMemoryNotifications.unshift(n);
        createdNotifs.push(n);
      } else {
        createdNotifs.push(existing);
      }
    }
  }

  if (targetsStaff) {
    const staffData = {
      role: 'staff',
      type: 'Academic',
      title: notifTitle,
      desc: notifDesc,
      time: notifTime,
      read: false,
      relatedId: relatedId
    };
    if (isDbConnected()) {
      try {
        const existing = await Notification.findOne({ relatedId: relatedId, role: 'staff' });
        if (!existing) {
          const n = await Notification.create(staffData);
          createdNotifs.push(n);
        } else {
          createdNotifs.push(existing);
        }
      } catch (e) {
        console.warn("DB notification creation warning:", e.message);
      }
    } else {
      const existing = inMemoryNotifications.find(n => n.relatedId === relatedId && n.role === 'staff');
      if (!existing) {
        const n = { _id: "notif_" + Date.now() + "_stf", ...staffData, createdAt: new Date().toISOString() };
        inMemoryNotifications.unshift(n);
        createdNotifs.push(n);
      } else {
        createdNotifs.push(existing);
      }
    }
  }

  return createdNotifs;
}

module.exports = {
  isDbConnected,
  inMemoryAnnouncements,
  inMemoryNotifications,
  inMemoryCommunityPosts,
  inMemoryCommunityComments,
  inMemorySupportIssues,
  createNotificationForAnnouncement
};
