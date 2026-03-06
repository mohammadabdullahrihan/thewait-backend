const Routine = require("../models/Routine");
const User = require("../models/User");

/**
 * Marks a task in the user's routine as completed based on a category.
 * Used for auto-checking tasks when actions are performed in other modules (Workout, Study, etc.)
 */
const syncTaskFromAction = async (userId, date, category, actionName = "") => {
  try {
    const user = await User.findById(userId);
    const activeRoutineName = user?.activeRoutineName || "Daily";

    const routine = await Routine.findOne({
      userId,
      date,
      name: activeRoutineName,
    });

    if (routine) {
      // Find the first incomplete task of this category
      const task = routine.tasks.find(
        (t) => t.category === category && !t.completed,
      );

      if (task) {
        task.completed = true;
        task.completedAt = new Date();

        // Recalculate completion rate
        const completedTasks = routine.tasks.filter((t) => t.completed).length;
        routine.completionRate = Math.round(
          (completedTasks / routine.tasks.length) * 100,
        );

        await routine.save();
        return { success: true, taskUpdated: true };
      }
    }
    return { success: true, taskUpdated: false };
  } catch (error) {
    console.error("Routine Sync Error:", error.message);
    return { success: false, error: error.message };
  }
};

const syncHabitsToRoutine = async (userId, date, habitsObj) => {
  try {
    const user = await User.findById(userId);
    const activeRoutineName = user?.activeRoutineName || "Daily";

    const routine = await Routine.findOne({
      userId,
      date,
      name: activeRoutineName,
    });

    if (routine) {
      let updated = false;
      const habitMapping = {
        wakeUp6am: "Discipline",
        workout: "Health",
        study: "Study",
        journal: "Mindfulness",
        sleep10pm: "Discipline",
      };

      const habitLabels = {
        wakeUp6am: "ঘুম থেকে ওঠা ও কোল্ড শাওয়ার",
        workout: "ওয়ার্কআউট",
        study: "পড়াশোনা",
        journal: "ডায়েরি লেখা",
        sleep10pm: "ঘুম (টার্গেট)",
      };

      for (const [key, category] of Object.entries(habitMapping)) {
        if (habitsObj[key] !== undefined) {
          // Find task that matches the habit name or category
          const label = habitLabels[key];
          const task = routine.tasks.find(
            (t) =>
              t.task.includes(label) ||
              (t.category === category && !t.completed),
          );

          if (task && task.completed !== habitsObj[key]) {
            task.completed = habitsObj[key];
            task.completedAt = task.completed ? new Date() : null;
            updated = true;
          }
        }
      }

      if (updated) {
        const completedTasks = routine.tasks.filter((t) => t.completed).length;
        routine.completionRate = Math.round(
          (completedTasks / routine.tasks.length) * 100,
        );
        await routine.save();
      }
    }
    return { success: true };
  } catch (error) {
    console.error("Habit Sync Error:", error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { syncTaskFromAction, syncHabitsToRoutine };
