import * as Module from 'node:module';
Module.registerHooks({ resolve(spec, context, nextResolve) { return nextResolve(spec, context); } });
