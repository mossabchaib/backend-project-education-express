// src/controllers/subscription.controller.js
const subscriptionService = require("../services/subscription.service");

async function submit(req, res) {
  try {
    const subscription = await subscriptionService.submitSubscription(req.user.id, req.body);
    res.status(201).json({ subscription });
  } catch (err) {
    console.error("❌ Error inside subscription.service:", err);
    res.status(400).json({ message: "فشل إرسال طلب الاشتراك", error: err.message });
  }
}

async function getMine(req, res) {
  try {
    const subscription = await subscriptionService.getMySubscription(req.user.id);
    res.status(200).json({ subscription });
  } catch (err) {
    res.status(500).json({ message: "فشل جلب الاشتراك", error: err.message });
  }
}

async function listPending(req, res) {
  try {
    const subscriptions = await subscriptionService.getPendingSubscriptions();
    res.status(200).json({ subscriptions });
  } catch (err) {
    res.status(500).json({ message: "فشل جلب الطلبات المعلّقة", error: err.message });
  }
}

async function listAll(req, res) {
  try {
    const subscriptions = await subscriptionService.getAllSubscriptions();
    res.status(200).json({ subscriptions });
  } catch (err) {
    res.status(500).json({ message: "فشل جلب الاشتراكات", error: err.message });
  }
}

// controller
async function approve(req, res) {
  try {
    const subscription = await subscriptionService.approveSubscription(
      req.params.id, req.user.id, req.body.days
    );
    res.status(200).json({ subscription });
  } catch (err) {
    res.status(400).json({ message: "فشل قبول الاشتراك", error: err.message });
  }
}

async function reject(req, res) {
  try {
    const subscription = await subscriptionService.rejectSubscription(req.params.id, req.user.id);
    res.status(200).json({ subscription });
  } catch (err) {
    res.status(400).json({ message: "فشل رفض الاشتراك", error: err.message });
  }
}

module.exports = { submit, getMine, listPending, listAll, approve, reject };