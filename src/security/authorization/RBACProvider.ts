/**
 * RBAC Authorization Provider for PowerScript Security
 * Placeholder implementation for Role-Based Access Control
 */

import {
    AuthzProvider,
    AuthorizationConfig,
    AuthorizationRequest,
    AuthorizationResult,
    Subject,
    Role,
    ABACPolicy,
    AuthorizationError
} from '../types';

export class RBACProvider implements AuthzProvider {
    public readonly name = 'rbac';
    public readonly version = '1.0.0';
    
    private config: AuthorizationConfig;
    private roles = new Map<string, Role>();
    private userRoles = new Map<string, string[]>(); // userId -> roleIds
    private policies = new Map<string, ABACPolicy>();

    constructor(config: AuthorizationConfig) {
        this.config = config;
        this.initializeDefaultRoles();
    }

    // Authorization Methods
    public async authorize(request: AuthorizationRequest): Promise<AuthorizationResult> {
        try {
            const userRoles = await this.getRoles(request.subject);
            const userPermissions = await this.getPermissions(request.subject);
            
            // Check direct permission
            const requiredPermission = `${request.action.id}:${request.resource.type}`;
            const hasDirectPermission = userPermissions.includes(requiredPermission) || 
                                       userPermissions.includes('*') ||
                                       userPermissions.includes(`*:${request.resource.type}`);

            if (hasDirectPermission) {
                return {
                    decision: 'permit',
                    reason: 'Direct permission granted',
                    obligations: [],
                    advice: [],
                    evaluationTime: Date.now()
                };
            }

            // Check role-based permissions
            for (const roleName of userRoles) {
                const role = this.roles.get(roleName);
                if (role) {
                    const hasRolePermission = role.permissions.includes(requiredPermission) || 
                                            role.permissions.includes('*') ||
                                            role.permissions.includes(`*:${request.resource.type}`);
                    
                    if (hasRolePermission) {
                        return {
                            decision: 'permit',
                            reason: `Permission granted via role: ${roleName}`,
                            obligations: [],
                            advice: [],
                            evaluationTime: Date.now()
                        };
                    }
                }
            }

            // Check super admin roles
            const isSuperAdmin = userRoles.some(role => 
                this.config.superAdminRoles.includes(role)
            );

            if (isSuperAdmin) {
                return {
                    decision: 'permit',
                    reason: 'Super admin access',
                    obligations: [],
                    advice: [],
                    evaluationTime: Date.now()
                };
            }

            return {
                decision: 'deny',
                reason: 'Insufficient permissions',
                obligations: [],
                advice: [],
                evaluationTime: Date.now()
            };

        } catch (error) {
            throw new AuthorizationError(`Authorization failed: ${error}`, 'AUTHZ_FAILED');
        }
    }

    public async hasPermission(subject: Subject, permission: string): Promise<boolean> {
        try {
            const userPermissions = await this.getPermissions(subject);
            
            return userPermissions.includes(permission) || 
                   userPermissions.includes('*') ||
                   userPermissions.includes(permission.split(':')[0] + ':*');
        } catch (error) {
            return false;
        }
    }

    public async getRoles(subject: Subject): Promise<string[]> {
        try {
            return this.userRoles.get(subject.id) || [];
        } catch (error) {
            return [];
        }
    }

    public async getPermissions(subject: Subject): Promise<string[]> {
        try {
            const userRoles = await this.getRoles(subject);
            const permissions: string[] = [];

            // Add direct permissions from subject attributes
            if (subject.attributes.permissions) {
                permissions.push(...subject.attributes.permissions);
            }

            // Add role-based permissions
            for (const roleName of userRoles) {
                const role = this.roles.get(roleName);
                if (role) {
                    permissions.push(...role.permissions);
                }
            }

            // Add default permissions
            permissions.push(...this.config.defaultPermissions);

            // Remove duplicates
            return [...new Set(permissions)];
        } catch (error) {
            return this.config.defaultPermissions;
        }
    }

    // Policy Management
    public async addPolicy(policy: ABACPolicy): Promise<void> {
        try {
            this.policies.set(policy.id, policy);
        } catch (error) {
            throw new AuthorizationError(`Failed to add policy: ${error}`, 'POLICY_ADD_FAILED');
        }
    }

    public async removePolicy(policyId: string): Promise<void> {
        try {
            this.policies.delete(policyId);
        } catch (error) {
            throw new AuthorizationError(`Failed to remove policy: ${error}`, 'POLICY_REMOVE_FAILED');
        }
    }

    public async updatePolicy(policy: ABACPolicy): Promise<void> {
        try {
            if (!this.policies.has(policy.id)) {
                throw new Error(`Policy ${policy.id} not found`);
            }
            this.policies.set(policy.id, policy);
        } catch (error) {
            throw new AuthorizationError(`Failed to update policy: ${error}`, 'POLICY_UPDATE_FAILED');
        }
    }

    // Role Management
    public async addRole(role: Role): Promise<void> {
        try {
            this.roles.set(role.id, role);
        } catch (error) {
            throw new AuthorizationError(`Failed to add role: ${error}`, 'ROLE_ADD_FAILED');
        }
    }

    public async removeRole(roleId: string): Promise<void> {
        try {
            this.roles.delete(roleId);
            
            // Remove role from all users
            for (const [userId, userRoles] of this.userRoles.entries()) {
                const updatedRoles = userRoles.filter(r => r !== roleId);
                this.userRoles.set(userId, updatedRoles);
            }
        } catch (error) {
            throw new AuthorizationError(`Failed to remove role: ${error}`, 'ROLE_REMOVE_FAILED');
        }
    }

    public async assignRole(subjectId: string, roleId: string): Promise<void> {
        try {
            if (!this.roles.has(roleId)) {
                throw new Error(`Role ${roleId} not found`);
            }

            const currentRoles = this.userRoles.get(subjectId) || [];
            if (!currentRoles.includes(roleId)) {
                currentRoles.push(roleId);
                this.userRoles.set(subjectId, currentRoles);
            }
        } catch (error) {
            throw new AuthorizationError(`Failed to assign role: ${error}`, 'ROLE_ASSIGN_FAILED');
        }
    }

    public async revokeRole(subjectId: string, roleId: string): Promise<void> {
        try {
            const currentRoles = this.userRoles.get(subjectId) || [];
            const updatedRoles = currentRoles.filter(r => r !== roleId);
            this.userRoles.set(subjectId, updatedRoles);
        } catch (error) {
            throw new AuthorizationError(`Failed to revoke role: ${error}`, 'ROLE_REVOKE_FAILED');
        }
    }

    // Helper Methods
    private initializeDefaultRoles(): void {
        // Create default roles
        const adminRole: Role = {
            id: 'admin',
            name: 'Administrator',
            description: 'Full system administrator',
            permissions: ['*'],
            metadata: { level: 'admin' }
        };

        const userRole: Role = {
            id: 'user',
            name: 'User',
            description: 'Standard user',
            permissions: ['read:*', 'write:own'],
            metadata: { level: 'user' }
        };

        const guestRole: Role = {
            id: 'guest',
            name: 'Guest',
            description: 'Guest user with limited access',
            permissions: ['read:public'],
            metadata: { level: 'guest' }
        };

        this.roles.set(adminRole.id, adminRole);
        this.roles.set(userRole.id, userRole);
        this.roles.set(guestRole.id, guestRole);

        // Assign some mock user roles for testing
        this.userRoles.set('user1', ['admin', 'user']);
        this.userRoles.set('user2', ['user']);
        this.userRoles.set('guest1', ['guest']);
    }
}