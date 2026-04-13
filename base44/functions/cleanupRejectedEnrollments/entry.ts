import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins can run this
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all rejected enrollments
    const enrollments = await base44.entities.Enrollment.filter({ status: 'rejected' });

    // Delete each rejected enrollment
    for (const enrollment of enrollments) {
      await base44.entities.Enrollment.delete(enrollment.id);
    }

    return Response.json({
      success: true,
      message: `Deleted ${enrollments.length} rejected enrollment(s)`,
      count: enrollments.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});