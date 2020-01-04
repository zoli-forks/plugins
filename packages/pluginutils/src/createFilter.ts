import { resolve, join, sep } from 'path';

import mm from 'micromatch';

import { CreateFilter } from '../types';

import ensureArray from './utils/ensureArray';

const ESCAPE_IN_PATH = '()+@!';

function getMatcherString(id: string, resolutionBase: string | false | null | undefined) {
  if (resolutionBase === false) {
    return id;
  }
  const resolvedPath = resolve(
    ...(typeof resolutionBase === 'string' ? [resolutionBase, id] : [id])
  );
  const result = resolvedPath
    .split(sep)
    .join('/')
    .replace(/[-^$*+?.()|[\]{}]/g, '\\$&');

  return result;
}

// function getMatcherString(id: string, resolutionBase: string | false | null | undefined) {
//   console.log('getMatcherString');
//   if (resolutionBase === false) {
//     return id;
//   }
//   console.log('  id', id);
//   const basePath = typeof resolutionBase === 'string' ? resolve(resolutionBase) : process.cwd();
//   let resultPath = basePath.split(sep).join('/');
//
//   console.log('  basePath', basePath);
//   console.log('  resultPath', resultPath);
//
//   for (const char of ESCAPE_IN_PATH) {
//     resultPath = resultPath.replace(new RegExp(`\\${char}`, 'g'), `\\${char}`);
//   }
//   console.log('  resultPath', resultPath);
//   resultPath = join(resultPath, id);
//   console.log('  resultPath', resultPath);
//   console.log('----');
//   return resultPath;
// }

const createFilter: CreateFilter = function createFilter(include?, exclude?, options?) {
  const resolutionBase = options && options.resolve;

  const getMatcher = (id: string | RegExp) =>
    id instanceof RegExp
      ? id
      : {
          test: mm.matcher(getMatcherString(id, resolutionBase), { dot: true })
        };

  const includeMatchers = ensureArray(include).map(getMatcher);
  const excludeMatchers = ensureArray(exclude).map(getMatcher);

  return function result(id: string | any): boolean {
    if (typeof id !== 'string') return false;
    if (/\0/.test(id)) return false;

    const pathId = id.split(sep).join('/');
    const ms = getMatcherString(id, resolutionBase);

    console.log('pathId', pathId);
    console.log('matcher string:', ms);

    for (let i = 0; i < excludeMatchers.length; ++i) {
      const matcher = excludeMatchers[i];
      if (matcher.test(pathId)) return false;
    }

    for (let i = 0; i < includeMatchers.length; ++i) {
      const matcher = includeMatchers[i];
      console.log('matcher', matcher);
      console.log('mather res:', matcher.test(pathId));
      if (matcher.test(pathId)) return true;
    }

    return !includeMatchers.length;
  };
};

export { createFilter as default };
