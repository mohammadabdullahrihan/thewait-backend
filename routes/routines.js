const express = require("express");
const router = express.Router();
const Routine = require("../models/Routine");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

// @route   GET /api/routines/:date
router.get("/:date", protect, async (req, res) => {
  try {
    const routineName = req.query.name || "Daily";
    let routine = await Routine.findOne({
      userId: req.user.id,
      date: req.params.date,
      name: routineName,
    });
    if (!routine) {
      let tasks = [];
      if (routineName === "Ramadan" || routineName === "রমজান") {
        tasks = [
          {
            time: "4:00 AM",
            task: "সেহরির জন্য ওঠা",
            category: "Discipline",
            completed: false,
          },
          {
            time: "4:20 AM",
            task: "সেহরি খাওয়া",
            category: "Health",
            completed: false,
          },
          {
            time: "4:40 AM",
            task: "তাহাজ্জুদ ও দোয়া",
            category: "Mindfulness",
            completed: false,
          },
          {
            time: "5:00 AM",
            task: "ফজরের নামাজ",
            category: "Mindfulness",
            completed: false,
          },
          {
            time: "5:30 AM",
            task: "কোরআন তিলাওয়াত",
            category: "Mindfulness",
            completed: false,
          },
          {
            time: "6:00 AM",
            task: "প্রধান ঘুম (৪ ঘণ্টা)",
            category: "Health",
            completed: false,
          },
          {
            time: "10:00 AM",
            task: "উঠে নতুন দিন শুরু",
            category: "Discipline",
            completed: false,
          },
          {
            time: "11:00 AM",
            task: "পড়া সেশন ১ (GED/IELTS)",
            category: "Study",
            completed: false,
          },
          {
            time: "12:00 PM",
            task: "ঘরের কাজ / পরিবারকে সাহায্য",
            category: "Other",
            completed: false,
          },
          {
            time: "1:00 PM",
            task: "পড়া সেশন ২ (GED/IELTS)",
            category: "Study",
            completed: false,
          },
          {
            time: "2:00 PM",
            task: "দুপুরের বিশ্রাম (নো মোবাইল)",
            category: "Health",
            completed: false,
          },
          {
            time: "3:00 PM",
            task: "ইবাদত / কোরআন তিলাওয়াত",
            category: "Mindfulness",
            completed: false,
          },
          {
            time: "4:00 PM",
            task: "পড়া সেশন ৩ (GED/IELTS)",
            category: "Study",
            completed: false,
          },
          {
            time: "5:00 PM",
            task: "ইফতারির প্রস্তুতি",
            category: "Other",
            completed: false,
          },
          {
            time: "6:00 PM",
            task: "ইফতার",
            category: "Health",
            completed: false,
          },
          {
            time: "6:30 PM",
            task: "মাগরিবের নামাজ",
            category: "Mindfulness",
            completed: false,
          },
          {
            time: "7:00 PM",
            task: "এশা ও তারাবীহ (মসজিদ)",
            category: "Mindfulness",
            completed: false,
          },
          {
            time: "8:00 PM",
            task: "ডিনার ও বিশ্রামের সময়",
            category: "Health",
            completed: false,
          },
          {
            time: "9:00 PM",
            task: "পড়া সেশন ৪ (রিভিশন)",
            category: "Study",
            completed: false,
          },
          {
            time: "9:30 PM",
            task: "ডায়েরি লেখা ও ট্র্যাকিং",
            category: "Mindfulness",
            completed: false,
          },
          {
            time: "10:00 PM",
            task: "ঘুম (টার্গেট)",
            category: "Discipline",
            completed: false,
          },
        ];
      } else {
        tasks = [
          {
            time: "6:00 AM",
            task: "ঘুম থেকে ওঠা ও কোল্ড শাওয়ার",
            category: "Discipline",
            completed: false,
          },
          {
            time: "6:30 AM",
            task: "ফজরের নামাজ / মেডিটেশন",
            category: "Mindfulness",
            completed: false,
          },
          {
            time: "7:00 AM",
            task: "সকালের ওয়ার্কআউট",
            category: "Health",
            completed: false,
          },
          {
            time: "8:00 AM",
            task: "নাস্তা ও কোরান পাঠ",
            category: "Mindfulness",
            completed: false,
          },
          {
            time: "9:00 AM",
            task: "GED/IELTS পড়াশোনা (পোমোডোরো ১)",
            category: "Study",
            completed: false,
          },
          {
            time: "11:00 AM",
            task: "GED/IELTS পড়াশোনা (পোমোডোরো ২)",
            category: "Study",
            completed: false,
          },
          {
            time: "1:00 PM",
            task: "দুপুরের খাবার ও বিশ্রাম",
            category: "Health",
            completed: false,
          },
          {
            time: "3:00 PM",
            task: "GED/IELTS পড়াশোনা (পোমোডোরো ৩)",
            category: "Study",
            completed: false,
          },
          {
            time: "5:00 PM",
            task: "সন্ধ্যার ওয়ার্কআউট / হাঁটা",
            category: "Health",
            completed: false,
          },
          {
            time: "7:00 PM",
            task: "রাতের পড়াশোনা",
            category: "Study",
            completed: false,
          },
          {
            time: "9:00 PM",
            task: "ডায়েরি লেখা ও রিভিউ",
            category: "Mindfulness",
            completed: false,
          },
          {
            time: "10:00 PM",
            task: "ঘুম",
            category: "Discipline",
            completed: false,
          },
        ];
      }
      routine = {
        date: req.params.date,
        tasks,
        completionRate: 0,
        name: routineName,
      };
    }
    res.json({ success: true, routine, routineName });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/routines
router.post("/", protect, async (req, res) => {
  try {
    const { date, tasks, name } = req.body;
    let routine = await Routine.findOne({
      userId: req.user.id,
      date,
      name: name || "Daily",
    });
    if (routine) {
      routine.tasks = tasks;
      const completedTasks = tasks.filter((t) => t.completed).length;
      routine.completionRate = Math.round(
        (completedTasks / tasks.length) * 100,
      );
      await routine.save();
    } else {
      const completedTasks = tasks.filter((t) => t.completed).length;
      const completionRate = tasks.length
        ? Math.round((completedTasks / tasks.length) * 100)
        : 0;
      routine = await Routine.create({
        userId: req.user.id,
        date,
        name: name || "Daily",
        tasks,
        completionRate,
      });
    }
    // Award XP for completing tasks
    if (routine.completionRate > 0) {
      const xpEarned = Math.floor(routine.completionRate / 10) * 5;
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { experience: xpEarned },
      });
    }
    res.json({ success: true, routine });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/routines/:date/task/:taskId
router.put("/:date/task/:taskId", protect, async (req, res) => {
  try {
    const { completed, name } = req.body;
    const routine = await Routine.findOne({
      userId: req.user.id,
      date: req.params.date,
      name: name || "Daily",
    });
    if (!routine) {
      return res
        .status(404)
        .json({ success: false, message: "রুটিন পাওয়া যায়নি" });
    }
    const task = routine.tasks.id(req.params.taskId);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "টাস্ক পাওয়া যায়নি" });
    }
    task.completed = completed;
    task.completedAt = completed ? new Date() : null;
    const completedTasks = routine.tasks.filter((t) => t.completed).length;
    routine.completionRate = Math.round(
      (completedTasks / routine.tasks.length) * 100,
    );
    await routine.save();
    // Award XP for task completion
    if (completed) {
      await User.findByIdAndUpdate(req.user.id, { $inc: { experience: 5 } });
    }
    res.json({ success: true, routine });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/routines/:date/task/:taskId
router.delete("/:date/task/:taskId", protect, async (req, res) => {
  try {
    const { name } = req.query;
    const routine = await Routine.findOne({
      userId: req.user.id,
      date: req.params.date,
      name: name || "Daily",
    });
    if (!routine) {
      return res
        .status(404)
        .json({ success: false, message: "রুটিন পাওয়া যায়নি" });
    }
    routine.tasks = routine.tasks.filter(
      (t) => t._id.toString() !== req.params.taskId,
    );
    const completedTasks = routine.tasks.filter((t) => t.completed).length;
    routine.completionRate = routine.tasks.length
      ? Math.round((completedTasks / routine.tasks.length) * 100)
      : 0;
    await routine.save();
    res.json({ success: true, routine });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/routines/:date/list
router.get("/:date/list/all", protect, async (req, res) => {
  try {
    const routines = await Routine.find({
      userId: req.user.id,
      date: req.params.date,
    }).select("name completionRate");
    res.json({ success: true, routines });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/routines/week/:startDate
router.get("/week/:startDate", protect, async (req, res) => {
  try {
    const start = new Date(req.params.startDate);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d.toISOString().split("T")[0]);
    }
    const routines = await Routine.find({
      userId: req.user.id,
      date: { $in: dates },
    });
    res.json({ success: true, routines, dates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/routines/:date
router.delete("/:date", protect, async (req, res) => {
  try {
    const { name } = req.query;
    await Routine.deleteOne({
      userId: req.user.id,
      date: req.params.date,
      name: name || "Daily",
    });
    res.json({ success: true, message: "রুটিন পুরোপুরি মুছে ফেলা হয়েছে" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
