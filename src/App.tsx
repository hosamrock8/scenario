/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppProvider } from './store/AppContext';
import { MainLayout } from './components/layout/MainLayout';

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
