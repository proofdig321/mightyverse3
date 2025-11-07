'use client';

import React, { useState } from 'react';
import { useRBAC } from '../../auth/rbac-provider';
import { Role } from '../../auth/roles';

interface UserRole {
  id: string;
  wallet: string;
  email?: string;
  roles: Role[];
  assignedAt: string;
  assignedBy: string;
}

export default function RBACPage() {
  const { isAdmin } = useRBAC();
  const [users, setUsers] = useState<UserRole[]>([
    { id: '1', wallet: '0x860Ec697167Ba865DdE1eC9e172004100613e970', roles: [Role.SUPER_ADMIN, Role.ADMIN], assignedAt: '2025-01-27', assignedBy: 'system' },
    { id: '2', wallet: '0x449e8b0f00000000000000000000000000000000', email: 'user@example.com', roles: [Role.VIEWER], assignedAt: '2025-01-27', assignedBy: 'admin' }
  ]);
  const [newWallet, setNewWallet] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);

  const handleAssignRole = () => {
    if (!newWallet || selectedRoles.length === 0) return;
    
    const newUser: UserRole = {
      id: Date.now().toString(),
      wallet: newWallet,
      roles: selectedRoles,
      assignedAt: new Date().toISOString().split('T')[0],
      assignedBy: 'admin'
    };
    
    setUsers(prev => [...prev, newUser]);
    setNewWallet('');
    setSelectedRoles([]);
  };

  const handleRoleToggle = (role: Role) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleRemoveUser = (id: string) => {
    setUsers(prev => prev.filter(user => user.id !== id));
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="mv-card p-8 text-center">
          <h1 className="mv-heading-lg text-red-400 mb-4">Access Denied</h1>
          <p className="mv-text-muted">Admin privileges required</p>
        </div>
      </div>
    );
  }



  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="mv-heading-xl mb-4">👥 Role Management</h1>
        <p className="mv-text-muted text-lg">Assign and manage user roles</p>
      </div>

      {/* Add New User */}
      <div className="mv-card p-6 mb-8">
        <h2 className="mv-heading-md mb-6">Assign New Role</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Wallet Address</label>
            <input
              type="text"
              value={newWallet}
              onChange={(e) => setNewWallet(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Roles</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {Object.values(Role).map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleToggle(role)}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedRoles.includes(role)
                      ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30'
                      : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
          
          <button
            onClick={handleAssignRole}
            disabled={!newWallet || selectedRoles.length === 0}
            className="mv-button"
          >
            Assign Roles
          </button>
        </div>
      </div>

      {/* Current Users */}
      <div className="mv-card p-6">
        <h2 className="mv-heading-md mb-6">Current Users ({users.length})</h2>
        <div className="space-y-4">
          {users.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="mv-heading-md mb-2">No Users Yet</h3>
              <p className="mv-text-muted">This is a new platform - assign roles to get started</p>
            </div>
          ) : (
            users.map((user) => (
            <div key={user.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                <div className="flex-1">
                  <div className="font-semibold text-white mb-2">
                    {user.wallet.slice(0, 8)}...{user.wallet.slice(-6)}
                  </div>
                  {user.email && (
                    <div className="text-sm mv-text-muted mb-2">{user.email}</div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {user.roles.map((role) => (
                      <span
                        key={role}
                        className="px-2 py-1 bg-yellow-400/20 text-yellow-400 rounded text-xs"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs mv-text-muted mt-2">
                    Assigned: {user.assignedAt} by {user.assignedBy}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm">
                    Edit
                  </button>
                  <button
                    onClick={() => handleRemoveUser(user.id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}