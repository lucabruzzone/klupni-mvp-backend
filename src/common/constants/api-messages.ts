import type { ApiCode } from './api-codes';

/**
 * Human-readable messages for each ApiCode. Used for developer debugging.
 */
export const ApiMessages: Record<ApiCode, string> = {
  // Generic
  VALIDATION_ERROR: 'Validation failed',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  INTERNAL_SERVER_ERROR: 'Internal server error',

  // Auth success
  USER_REGISTERED: 'Check your email to verify your account',
  EMAIL_VERIFIED: 'Email verified successfully',
  VERIFICATION_EMAIL_SENT:
    'If an account exists with this email, a verification link has been sent',
  PASSWORD_RESET_EMAIL_SENT:
    'If an account exists with this email, a password reset link has been sent',
  PASSWORD_RESET: 'Password has been reset successfully',
  LOGIN_SUCCESS: 'Logged in successfully',
  REFRESH_SUCCESS: 'Token refreshed successfully',
  LOGOUT_SUCCESS: 'Logged out successfully',
  USER_INFO_RETRIEVED: 'User info retrieved',
  USER_PROFILE_RETRIEVED: 'User profile retrieved',
  USERNAME_AVAILABLE: 'Username is available',
  USERS_SEARCH_SUCCESS: 'Users search completed',
  USER_PUBLIC_PROFILE_RETRIEVED: 'Public profile retrieved',
  USER_PROFILE_UPDATED: 'Profile updated successfully',

  // Auth errors
  EMAIL_ALREADY_IN_USE: 'Email already in use',
  INVALID_VERIFICATION_TOKEN: 'Invalid verification token',
  VERIFICATION_TOKEN_ALREADY_USED: 'Verification token has already been used',
  VERIFICATION_TOKEN_EXPIRED: 'Verification token has expired',
  EMAIL_ALREADY_VERIFIED: 'Email is already verified',
  INVALID_RESET_TOKEN: 'Invalid or expired reset token',
  RESET_TOKEN_ALREADY_USED: 'This reset link has already been used',
  RESET_TOKEN_EXPIRED: 'This reset link has expired',
  INVALID_CREDENTIALS: 'Invalid credentials',
  EMAIL_NOT_VERIFIED: 'Please verify your email before logging in',
  REFRESH_TOKEN_NOT_FOUND: 'Refresh token not found',
  REFRESH_TOKEN_INVALID: 'Invalid or expired refresh token',
  USER_NOT_FOUND: 'User not found',
  USERNAME_INVALID_LENGTH: 'Username must be between 3 and 30 characters',
  USERNAME_INVALID_CHARS:
    'Username can only contain letters, numbers and underscores',
  USERNAME_TAKEN: 'This username is already taken',
  SEARCH_QUERY_TOO_SHORT: 'Search query must be at least 2 characters',

  // Activities success
  ACTIVITY_CREATED: 'Activity created successfully',
  ACTIVITY_LIST_RETRIEVED: 'Activities list retrieved',
  ACTIVITY_RETRIEVED: 'Activity retrieved',
  ACTIVITY_PARTICIPANTS_LIST_RETRIEVED: 'Participants list retrieved',
  ACTIVITY_UPDATED: 'Activity updated successfully',
  ACTIVITY_DELETED: 'Activity deleted successfully',

  // Activities errors
  ACTIVITY_NOT_FOUND: 'Activity not found',
  ACTIVITY_NOT_ACTIVE: 'Activity is no longer active',
  ACTIVITY_ALREADY_ENDED: 'Activity has already ended',
  ACTIVITY_MODIFY_FORBIDDEN:
    'You do not have permission to modify this activity',

  // Participations success
  PARTICIPANT_ADDED: 'Participant added successfully',
  PARTICIPANT_ROLE_UPDATED: 'Participant role updated',
  PARTICIPANT_REMOVED: 'Participant removed successfully',
  ACTIVITY_LEFT: 'You have left the activity',

  // Participations errors
  ACTIVITY_FULL: 'Activity has reached the maximum number of participants',
  PARTICIPATION_NOT_FOUND: 'Participation not found in this activity',
  ACTIVE_PARTICIPATION_NOT_FOUND:
    'Active participation not found in this activity',
  CANNOT_CHANGE_OWN_ROLE: 'You cannot change your own role',
  ONLY_REGISTERED_CAN_BE_HOST:
    'Only registered users can be assigned the host role',
  CANNOT_REMOVE_HOST: 'Cannot remove a host from the activity',
  NOT_ACTIVE_PARTICIPANT: 'You are not an active participant in this activity',
  CANNOT_REMOVE_SOLE_HOST:
    'You are the only host, assign another host before leaving',

  // External contacts success
  EXTERNAL_CONTACT_CREATED: 'External contact created',
  EXTERNAL_CONTACT_LIST_RETRIEVED: 'External contacts list retrieved',
  EXTERNAL_CONTACT_RETRIEVED: 'External contact retrieved',
  EXTERNAL_CONTACT_UPDATED: 'External contact updated',
  EXTERNAL_CONTACT_DELETED: 'External contact deleted successfully',

  // External contacts errors
  EXTERNAL_CONTACT_NOT_FOUND:
    'External contact not found or does not belong to you',

  // Invitations success
  INVITATION_CREATED: 'Invitation sent',
  INVITATION_BATCH_CREATED: 'Invitations batch processed',
  INVITATION_LIST_RETRIEVED: 'Invitations list retrieved',
  INVITATION_RECEIVED_LIST_RETRIEVED: 'Received invitations list retrieved',
  INVITATION_PREVIEW_RETRIEVED: 'Invitation preview retrieved',
  INVITATION_ACCEPTED: 'You have joined the activity',
  INVITATION_CANCELLED: 'Invitation cancelled',

  // Invitations errors
  INVITATION_USER_OR_CONTACT_REQUIRED:
    'Either userId or externalContactId must be provided',
  INVITATION_BOTH_PROVIDED:
    'Only one of userId or externalContactId can be provided',
  INVITATION_ACTIVITY_FULL:
    'Activity has reached the maximum number of participants (including pending invitations)',
  INVITATION_CANNOT_INVITE_SELF: 'You cannot invite yourself',
  INVITATION_USER_ALREADY_PARTICIPANT:
    'This user is already an active participant in this activity',
  INVITATION_ALREADY_PENDING:
    'A pending invitation already exists for this user in this activity',
  INVITATION_EXTERNAL_CONTACT_NO_EMAIL:
    'This external contact does not have an email address',
  INVITATION_EXTERNAL_CONTACT_ALREADY_PARTICIPANT:
    'This external contact is already an active participant in this activity',
  INVITATION_BATCH_EMPTY: 'Provide at least one userId or externalContactId',
  INVITATION_BATCH_TOO_MANY: 'Cannot invite more than 50 recipients at once',
  INVITATION_INVALID: 'Invalid invitation',
  INVITATION_ALREADY_ACCEPTED: 'This invitation has already been accepted',
  INVITATION_REJECTED: 'This invitation has been rejected',
  INVITATION_ALREADY_CANCELLED: 'This invitation has been cancelled',
  INVITATION_EXPIRED: 'Invitation has expired',
  INVITATION_ACTIVITY_NOT_OPEN: 'Activity is no longer open',
  INVITATION_INVITEE_ALREADY_PARTICIPANT:
    'This invitee is already an active participant in this activity',
  INVITATION_NOT_FOUND: 'Invitation not found in this activity',
  INVITATION_CANCEL_INVALID_STATUS:
    'Cannot cancel an invitation with this status',
  INVITATION_MANAGE_FORBIDDEN:
    'You do not have permission to manage invitations for this activity',
};
