import codeTransformerVite from '@apm-js-collab/code-transformer-bundler-plugins/vite';
import type { Plugin } from 'vite';

export function wrappedPlugin(): Plugin {
  const upstream = codeTransformerVite({ instrumentations: [] });
  return { name: 'wrapped', transform: upstream.transform };
}
