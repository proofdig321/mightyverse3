import React, { ReactNode } from 'react';
import { RBACProvider } from './auth/rbac-provider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <RBACProvider>
      {children}
    </RBACProvider>
  );
}
