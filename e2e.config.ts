import type { E2EConfig } from 'e2e';
import { web } from '@e2e-dev/web';

export default {
  targets: [
    {
      engine: web({ viewport: { width: 1280, height: 720 } }),
      app: {
        url: 'http://localhost:3200',
        // Inicia el servidor de desarrollo Vite si no está activo, o reutiliza el existente
        command: {
          executable: process.platform === 'win32' ? 'cmd.exe' : 'npm',
          args: process.platform === 'win32' ? ['/c', 'npm', 'run', 'dev'] : ['run', 'dev'],
          reuseExisting: true,
        },
      },
    },
  ],
} satisfies E2EConfig;
