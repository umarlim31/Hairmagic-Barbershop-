type Identity = { userId: string; email: string } | null;

// Only the dispatch-verified identity may be passed here, never a request body or query.
export function feedbackAccess(user: Identity, ownerEmail: string | undefined): 200 | 401 | 403 | 503 {
  if (!ownerEmail?.trim()) return 503;
  if (!user?.userId || !user.email) return 401;
  return user.email.trim().toLowerCase() === ownerEmail.trim().toLowerCase() ? 200 : 403;
}
