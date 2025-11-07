'use client';

/**
 * Role Assigner Component
 * Form for assigning roles to wallet addresses
 */

import React, { useState } from 'react';
import { Role } from '../../../auth/roles';
import { useRBAC } from '../../../auth/rbac-provider';
import { createRoleManifest } from '../../../../utils/auth/role-manifest';
import { signRoleAssignment } from '../../../../utils/auth/signature-verify';

interface RoleAssignment {
  wallet: string;
  roles: Role[];
  assignedAt: string;
  assignedBy: string;
}

interface RoleAssignerProps {
  onRoleAssigned: (assignment: RoleAssignment) => void;
  existingAssignments: RoleAssignment[];
}

const ROLE_DESCRIPTIONS = {
  [Role.SUPER_ADMIN]: 'Ultimate platform control, can manage admins and system settings',
  [Role.ADMIN]: 'Full platform access, can manage all users and content',
  [Role.CURATOR]: 'Can review and approve content, manage campaigns',
  [Role.ANIMATOR]: 'Can upload animations and manage their content',
  [Role.SPONSOR]: 'Can create and manage advertising campaigns',
  [Role.VIEWER]: 'Basic viewing access to public content'
};

export default function RoleAssigner({ onRoleAssigned, existingAssignments }: RoleAssignerProps) {
  const { wallet: adminWallet } = useRBAC();
  const [targetWallet, setTargetWallet] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRoleToggle = (role: Role) => {
    setSelectedRoles(prev => 
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const validateWalletAddress = (address: string): boolean => {
    // Basic Ethereum address validation
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adminWallet) {
      setError('Admin wallet not connected');
      return;
    }

    if (!validateWalletAddress(targetWallet)) {
      setError('Invalid wallet address format');
      return;
    }

    if (selectedRoles.length === 0) {
      setError('Please select at least one role');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Check if user already has roles assigned
      const existingAssignment = existingAssignments.find(
        a => a.wallet.toLowerCase() === targetWallet.toLowerCase()
      );

      // Create signature for role assignment
      // In production, this would use actual wallet signing
      const mockSignature = `0x${'a'.repeat(130)}`; // Mock signature for development
      
      // Create role manifest on IPFS
      const manifestCid = await createRoleManifest(
        targetWallet,
        selectedRoles,
        adminWallet,
        mockSignature
      );

      // Create assignment record
      const assignment: RoleAssignment = {
        wallet: targetWallet.toLowerCase(),
        roles: selectedRoles,
        assignedAt: new Date().toISOString(),
        assignedBy: adminWallet
      };

      onRoleAssigned(assignment);

      setSuccess(
        existingAssignment
          ? `Roles updated for ${targetWallet}`
          : `Roles assigned to ${targetWallet}`
      );
      
      // Reset form
      setTargetWallet('');
      setSelectedRoles([]);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign roles';
      setError(errorMessage);
      console.error('Error assigning roles:', err);
    } finally {
      setLoading(false);
    }
  };

  const existingRoles = existingAssignments.find(
    a => a.wallet.toLowerCase() === targetWallet.toLowerCase()
  )?.roles || [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900">Assign Roles</h2>
        <p className="mt-1 text-sm text-gray-600">
          Grant roles to wallet addresses. All assignments are signed and stored on IPFS.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Wallet Address Input */}
        <div>
          <label htmlFor="wallet" className="block text-sm font-medium text-gray-700">
            Wallet Address
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="wallet"
              value={targetWallet}
              onChange={(e) => setTargetWallet(e.target.value)}
              placeholder="0x..."
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>
          {targetWallet && !validateWalletAddress(targetWallet) && (
            <p className="mt-1 text-sm text-red-600">Invalid wallet address format</p>
          )}
          {existingRoles.length > 0 && (
            <p className="mt-1 text-sm text-yellow-600">
              This wallet currently has roles: {existingRoles.join(', ')}
            </p>
          )}
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Roles
          </label>
          <div className="space-y-3">
            {Object.values(Role).map((role) => (
              <div key={role} className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id={`role-${role}`}
                    type="checkbox"
                    checked={selectedRoles.includes(role)}
                    onChange={() => handleRoleToggle(role)}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor={`role-${role}`} className="font-medium text-gray-700">
                    {role}
                  </label>
                  <p className="text-gray-500">{ROLE_DESCRIPTIONS[role]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>{success}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !targetWallet || selectedRoles.length === 0}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Assigning...
              </>
            ) : (
              'Assign Roles'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}