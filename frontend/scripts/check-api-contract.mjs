import { error, log } from 'node:console';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import ts from 'typescript';

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = resolve(frontendRoot, 'src/api/endpoints.ts');
const specPath = resolve(frontendRoot, '../backend/src/test/resources/openapi.json');
const sourceText = readFileSync(sourcePath, 'utf8');
const source = ts.createSourceFile(sourcePath, sourceText, ts.ScriptTarget.Latest, true);
const spec = JSON.parse(readFileSync(specPath, 'utf8'));
const apiPaths = new Map();

function pathFromExpression(expression) {
  if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
    return expression.text.split('?')[0];
  }
  if (!ts.isTemplateExpression(expression)) return null;
  let path = expression.head.text;
  for (const span of expression.templateSpans) {
    if (span.expression.getText(source).includes('filters.size')) return path.split('?')[0];
    path += `{${span.expression.getText(source)}}${span.literal.text}`;
  }
  return path.split('?')[0];
}

function methodFromOptions(argument) {
  if (!argument || !ts.isObjectLiteralExpression(argument)) return 'GET';
  const property = argument.properties.find(
    (candidate) =>
      ts.isPropertyAssignment(candidate) &&
      ts.isIdentifier(candidate.name) &&
      candidate.name.text === 'method',
  );
  return property &&
    ts.isPropertyAssignment(property) &&
    (ts.isStringLiteral(property.initializer) ||
      ts.isNoSubstitutionTemplateLiteral(property.initializer))
    ? property.initializer.text.toUpperCase()
    : 'GET';
}

function collectEndpoints(node) {
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'apiRequest') {
    const pathArgument = node.arguments[0];
    if (pathArgument) {
      const path = pathFromExpression(pathArgument);
      if (path) apiPaths.set(`${methodFromOptions(node.arguments[1])} ${path}`, path);
    }
  }
  ts.forEachChild(node, collectEndpoints);
}

collectEndpoints(source);

const clientSource = readFileSync(resolve(frontendRoot, 'src/api/client.ts'), 'utf8');
const refreshPath = clientSource.match(/const refreshPath = ['"]([^'"]+)['"]/);
if (refreshPath) apiPaths.set(`POST ${refreshPath[1]}`, refreshPath[1]);

const documentedPaths = new Set();
for (const [path, methods] of Object.entries(spec.paths ?? {})) {
  const normalizedPath = path.startsWith('/api/') ? path.slice(4) : path;
  for (const method of Object.keys(methods)) {
    documentedPaths.add(`${method.toUpperCase()} ${normalizedPath}`);
  }
}

const missing = [...apiPaths.keys()].filter((endpoint) => !documentedPaths.has(endpoint)).sort();
if (missing.length > 0) {
  error('Frontend calls missing from the committed backend OpenAPI spec:');
  for (const endpoint of missing) error(`  ${endpoint}`);
  process.exitCode = 1;
} else {
  log(`API contract verified: ${apiPaths.size} frontend operations match OpenAPI.`);
}
