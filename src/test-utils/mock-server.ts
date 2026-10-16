import http from 'node:http';

// Re-export common mock server implementation to eliminate duplicate code across test suites
// @ts-ignore
const { createMockApiServer, resolveRoleFromEmail } = require('../../tests/performance/mock-server');

export { createMockApiServer, resolveRoleFromEmail };