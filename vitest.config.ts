// Minimal Vitest config file replaced to avoid loading Vite in this environment.
// Keep default behavior and rely on CLI include pattern when running tests here.
// Use jsdom so DOM-based UI tests can run (Canvas, DetailsPanel, etc.).
// Export a plain object to avoid importing ESM-only vite modules when Vitest
// loads this config in CommonJS contexts.
const path = require('path');

export default {
	test: {
		environment: 'jsdom',
		globals: true,
		include: [
			'OliveBranch/tests/authMiddleware.spec.ts',
			'OliveBranch/tests/importRoute.spec.ts',
			'OliveBranch/tests/importRoute.rbac.integration.spec.ts',
			'OliveBranch/tests/importRoute.nonDry.integration.spec.ts',
			'OliveBranch/tests/graphService.spec.ts',
			'OliveBranch/tests/auth.spec.ts',
			'OliveBranch/tests/nodeService.spec.ts',
			'OliveBranch/tests/smoke.spec.ts',
			'OliveBranch/tests/canvas.ui.spec.tsx',
			'OliveBranch/tests/canvas.drag.spec.tsx',
			'OliveBranch/tests/details.ui.spec.tsx'
		],
	},
	resolve: {
		alias: {
			'next/server': path.resolve(__dirname, 'node_modules/next/server.js'),
			'@': path.resolve(__dirname, 'OliveBranch'),
			'@local/design-system': path.resolve(__dirname, 'design-system', 'src'),
		},
	},
} as any;
