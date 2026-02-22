const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignup(body: {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}) {
  const { email, password, firstName, lastName } = body;
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return { error: 'Valid email is required' };
  }
  if (!password || typeof password !== 'string') {
    return { error: 'Password is required' };
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters' };
  }
  if (!firstName || typeof firstName !== 'string' || !firstName.trim()) {
    return { error: 'First name is required' };
  }
  if (!lastName || typeof lastName !== 'string' || !lastName.trim()) {
    return { error: 'Last name is required' };
  }
  return null;
}
