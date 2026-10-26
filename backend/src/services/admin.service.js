const BookingService = require('./booking.service');
const SlotService = require('./slot.service');
const TransactionService = require('./transaction.service');
const AnalyticsService = require('./analytics.service');
const AuditService = require('./audit.service');
const UserRepository = require('../repositories/user.repository');
const { AppError } = require('../middleware/errorHandler');

const ALLOWED_ROLES = ['Admin', 'Mandi_Officer', 'Trader', 'Farmer'];

const AdminService = {
  async getDashboardOverview(filters = {}) {
    const [operational, utilization, txnSummary, recentBookings] = await Promise.all([
      AnalyticsService.getOperationalMetrics(filters),
      SlotService.getUtilization(),
      TransactionService.getSummary(),
      BookingService.getAllBookings({ limit: 10 })
    ]);

    return {
      operational,
      utilization,
      transactions: txnSummary,
      recentBookings
    };
  },

  /**
   * Fetch paginated users with optional search and role filtering
   */
  async getAllUsers(filters = {}) {
    return UserRepository.findAll(filters);
  },

  /**
   * Fetch single user details by ID
   */
  async getUserById(userId) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new AppError(`User with ID ${userId} not found`, 404, 'USER_NOT_FOUND');
    }
    return user;
  },

  /**
   * Promote or demote an eligible user with strict administrative safeguards:
   * 1. Self-demotion guard: Admin cannot remove their own administrator access.
   * 2. Last-admin guard: System prevents removing/demoting the last active administrator.
   * 3. Audit trail: Every role alteration is logged to application_audit_log.
   */
  async updateUserRole({ actorUserId, actorUsername, targetUserId, newRole }) {
    if (!newRole || !ALLOWED_ROLES.includes(newRole)) {
      throw new AppError(
        `Invalid role '${newRole}'. Allowed roles: ${ALLOWED_ROLES.join(', ')}`,
        400,
        'INVALID_ROLE'
      );
    }

    const targetId = parseInt(targetUserId, 10);
    const actorId = parseInt(actorUserId, 10);

    if (!targetId || isNaN(targetId)) {
      throw new AppError('Valid numeric target user ID is required', 400, 'INVALID_USER_ID');
    }

    const targetUser = await UserRepository.findById(targetId);
    if (!targetUser) {
      throw new AppError(`User with ID ${targetId} not found`, 404, 'USER_NOT_FOUND');
    }

    // Safeguard 1: Prevent self-demotion
    if (actorId === targetId && targetUser.User_Role === 'Admin' && newRole !== 'Admin') {
      throw new AppError(
        'Security safeguard: Administrators cannot demote or remove their own administrative role',
        400,
        'CANNOT_DEMOTE_SELF'
      );
    }

    // Safeguard 2: Prevent demoting the last active administrator
    if (targetUser.User_Role === 'Admin' && newRole !== 'Admin') {
      const activeAdminCount = await UserRepository.countActiveAdmins();
      if (activeAdminCount <= 1) {
        throw new AppError(
          'Security safeguard: Cannot demote the last remaining active administrator in the system',
          409,
          'LAST_ADMIN_PROTECTED'
        );
      }
    }

    // If role already matches, return existing record
    if (targetUser.User_Role === newRole) {
      return targetUser;
    }

    const previousRole = targetUser.User_Role;

    // Persist role transition in database
    await UserRepository.updateUserRole(targetId, newRole);

    // Audit Logging: Log sensitive role promotion or demotion
    await AuditService.logAudit({
      tableName: 'User_Login',
      operationType: 'ROLE_CHANGE',
      recordId: targetId,
      oldData: {
        userId: targetId,
        username: targetUser.Username,
        email: targetUser.Email,
        role: previousRole
      },
      newData: {
        userId: targetId,
        username: targetUser.Username,
        email: targetUser.Email,
        role: newRole
      },
      changedBy: actorUsername || `Admin#${actorId}`
    });

    const updatedUser = await UserRepository.findById(targetId);
    return updatedUser;
  }
};

module.exports = AdminService;
