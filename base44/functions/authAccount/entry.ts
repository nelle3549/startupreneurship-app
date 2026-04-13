import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

async function hashPassword(salt, password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateSalt() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, username, password, email, role } = body;

    if (!action || !username || !password) {
      return Response.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const usernameClean = username.trim().toLowerCase();

    if (action === 'signup') {
      // Check if username exists
      const existing = await base44.asServiceRole.entities.UserAccount.filter({ username: usernameClean });
      if (existing.length > 0) {
        return Response.json({ error: 'Username already taken.' }, { status: 409 });
      }

      const salt = generateSalt();
      const hash = await hashPassword(salt, password);

      const account = await base44.asServiceRole.entities.UserAccount.create({
        username: usernameClean,
        password_hash: hash,
        password_salt: salt,
        email: email || '',
        role: role || 'guest',
        facilitator_status: 'none',
      });

      // Also create in User entity for admin visibility
      await base44.asServiceRole.entities.User.create({
        first_name: usernameClean,
        last_name: '',
        email: email || '',
        role: role || 'guest',
      });

      return Response.json({ success: true, account: { id: account.id, username: account.username, email: account.email, role: account.role } });

    } else if (action === 'login') {
      const accounts = await base44.asServiceRole.entities.UserAccount.filter({ username: usernameClean });
      if (accounts.length === 0) {
        return Response.json({ error: 'Incorrect username or password.' }, { status: 401 });
      }

      const account = accounts[0];
      const hash = await hashPassword(account.password_salt, password);

      if (hash !== account.password_hash) {
        return Response.json({ error: 'Incorrect username or password.' }, { status: 401 });
      }

      return Response.json({ success: true, account: { id: account.id, username: account.username, email: account.email, role: account.role, first_name: account.first_name, last_name: account.last_name, facilitator_status: account.facilitator_status } });

    } else {
      return Response.json({ error: 'Invalid action.' }, { status: 400 });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});