import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { username, email, role } = body;

    if (!username) {
      return Response.json({ error: 'Username is required.' }, { status: 400 });
    }

    // Check if User record already exists
    const existing = await base44.asServiceRole.entities.User.filter({ email });
    
    if (existing.length > 0) {
      // Update existing
      await base44.asServiceRole.entities.User.update(existing[0].id, {
        full_name: username,
        first_name: username,
        last_name: '',
        email: email || '',
        role: role || 'student',
      });
      return Response.json({ success: true, message: 'User updated' });
    } else {
      // Create new User record
      const user = await base44.asServiceRole.entities.User.create({
        full_name: username,
        first_name: username,
        last_name: '',
        email: email || '',
        role: role || 'student',
      });
      return Response.json({ success: true, message: 'User created', user });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});