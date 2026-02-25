#!/usr/bin/env node

// Development entry point — runs TS files directly via ts-node
import {execute} from '@oclif/core'

await execute({development: true, dir: import.meta.url})
