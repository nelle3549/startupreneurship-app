import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();

    if (!caller) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetUserId } = await req.json();

    if (!targetUserId) {
      return Response.json({ error: 'targetUserId is required' }, { status: 400 });
    }

    const isAdmin = caller.role === 'admin';
    const isSelf = caller.id === targetUserId;

    if (!isAdmin && !isSelf) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all users to find target and potential admin for classroom transfer
    const allUsers = await base44.asServiceRole.entities.User.list();
    const targetUser = allUsers.find(u => u.id === targetUserId);

    if (!targetUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const targetEmail = targetUser.email;

    // Check if facilitator — transfer classrooms to first available admin
    const userAccounts = await base44.asServiceRole.entities.UserAccount.filter({ email: targetEmail });
    const userAccount = userAccounts[0];

    if (userAccount?.role === 'facilitator') {
      const classrooms = await base44.asServiceRole.entities.Classroom.filter({ facilitator_id: targetUserId });

      if (classrooms.length > 0) {
        const adminUser = allUsers.find(u => u.role === 'admin' && u.id !== targetUserId);
        if (adminUser) {
          for (const classroom of classrooms) {
            await base44.asServiceRole.entities.Classroom.update(classroom.id, {
              facilitator_id: adminUser.id,
              facilitator_email: adminUser.email,
            });
          }
        }
      }
    }

    // Log deleted user name before removing
    await base44.asServiceRole.entities.DeletedUserLog.create({
      user_id: targetUserId,
      email: targetEmail,
      first_name: userAccount?.first_name || "",
      last_name: userAccount?.last_name || "",
      full_name: [userAccount?.first_name, userAccount?.last_name].filter(Boolean).join(" ") || targetUser.full_name || "",
      role: userAccount?.role || targetUser.role || "guest",
      deleted_date: new Date().toISOString(),
    });

    // Delete UserAccount
    if (userAccount) {
      await base44.asServiceRole.entities.UserAccount.delete(userAccount.id);
    }

    // Delete EvaluatorProgress
    const progressRecords = await base44.asServiceRole.entities.EvaluatorProgress.filter({ created_by: targetEmail });
    for (const r of progressRecords) {
      await base44.asServiceRole.entities.EvaluatorProgress.delete(r.id);
    }

    // Delete UserActivity
    const activities = await base44.asServiceRole.entities.UserActivity.filter({ created_by: targetEmail });
    for (const r of activities) {
      await base44.asServiceRole.entities.UserActivity.delete(r.id);
    }

    // Delete Enrollments (as student)
    const enrollments = await base44.asServiceRole.entities.Enrollment.filter({ student_id: targetUserId });
    for (const r of enrollments) {
      await base44.asServiceRole.entities.Enrollment.delete(r.id);
    }

    // Delete StudentLessonProgress
    const lessonProgress = await base44.asServiceRole.entities.StudentLessonProgress.filter({ student_id: targetUserId });
    for (const r of lessonProgress) {
      await base44.asServiceRole.entities.StudentLessonProgress.delete(r.id);
    }

    // Finally delete the User entity itself
    await base44.asServiceRole.entities.User.delete(targetUserId);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});