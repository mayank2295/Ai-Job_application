export const ROLES = {
  ADMIN: 'ADMIN',
  RECRUITER: 'RECRUITER',
  CANDIDATE: 'CANDIDATE',
}

export const ROLE_ROUTES = {
  ADMIN: '/admin',
  RECRUITER: '/recruiter',
  CANDIDATE: '/candidate',
}

export const MATCH_COLORS = (score) => {
  if (score >= 75) return 'text-green-600 bg-green-50'
  if (score >= 50) return 'text-yellow-600 bg-yellow-50'
  return 'text-red-600 bg-red-50'
}

export const MATCH_BAR_COLOR = (score) => {
  if (score >= 75) return 'bg-green-500'
  if (score >= 50) return 'bg-yellow-500'
  return 'bg-red-500'
}
