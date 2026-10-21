---
title: "Sherlup, a tool to let LLMs check your dependencies before you upgrade"
date: "2026-03-05T08:59:12Z"
modified: "2026-03-05T11:01:45Z"
lang: "en"
category: "tecnologia"
path: "/tecnologia/sherlup-a-tool-to-let-llms-check-your-dependencies-before-you-upgrade/"
wpId: 293
---

TL;DR: We can make supply chain attacks more difficult by checking with LLMs the dependencies’ new code before upgrading. I don’t have time to build this, but I think such a tool would be really useful.

The nodejs ecosystem is one of the most thriving and interconnected. If you want to build something new there is probably already most of the code you need to write in some npm packages. And if you look inside the packages you used for your project they were also built using hundreds of dependencies. That’s why the meme about `node_modules` exists, every time you reuse someone else’s code literally megabytes of code coming from thousands of different sources is downloaded in your computer.

Now imagine being a malicious hacker willing to exploit the software you are building. From her perspective is it better to target the few lines you wrote or one of the millions of lines you are not even checking?

These kind of attacks, in which the bad actor targets your dependencies are called supply chain attacks. If you want to read more about it, I suggest you read [this blog post from Cloudflare](https://www.cloudflare.com/learning/security/what-is-a-supply-chain-attack/).

The Nodejs ecosystem is particularly subject to these kinds of attacks because of the interconnectivity we discussed before and because the heavy usage of automation in dependency management. Tools like Renovate automatically create pull requests on your repository with upgraded dependencies and it’s literally impossible for the project maintainer to check every new line of code coming from the upgraded dependencies, and let’s not even discuss checking every dependency’s dependencies code.

That’s where I had the idea: the job of checking every possible dependency is impossible for a human, but it is certainly possible for an LLM. Of course LLMs will not find every vulnerability, but I think they will make the attacker’s life much harder. It will become an additional step of the stack that the attacker needs to bypass in order to correctly ship the dependency into your code.

Since I just had a baby and I’m currently without any personal time, I decided to vibe code this proof of concept called Sherlup (Sherlock+upgrade), a CLI utility that automatically checks every to-be-upgraded dependency (and it also supports Renovate if available in the project).

A similar tool already exists called [Socket.dev](https://socket.dev), and it’s worth mentioning the key differences. Socket analyzes complete package snapshots rather than focusing on what actually changed between versions, and it runs entirely on their proprietary AI pipeline, you have no control over which model is used or where your code is sent. Sherlup instead focuses on the diff between versions and, being an open-source CLI, lets you plug in any LLM you want, including locally-running ones.

See below for an example of usage of `sherlup`.

I wrote this blog post because I think there is need in the ecosystem for such a tool, and I’m hoping that someone with more time than me will be happy to start experimenting in this direction.

```
marcocastignoli@Mac sourcify % sherlup audit --verbose

Using renovate config: renovate.json
Found 7 available update(s). Analyzing...

Analyzing @aws-sdk/client-s3 3.992.0 → 3.1001.0...
Analyzing @google-cloud/cloud-sql-connector 1.9.0 → 1.9.1...
Analyzing @shazow/whatsabi 0.25.0 → 0.26.0...
Analyzing @types/pg 8.16.0 → 8.18.0...
Analyzing dbmate 2.30.0 → 2.31.0...
Analyzing pg 8.18.0 → 8.19.0...
Analyzing solc 0.8.33 → 0.8.34...

sherlup — Dependency Security Analysis
──────────────────────────────────────────────────────

🟡 @aws-sdk/client-s3 3.992.0 → 3.1001.0 [LOW] score: 28%
The update introduces explicit handling for the '**proto**' property when merging objects, which is a common indicator of prototype pollution mitigation, but the implementation is incomplete.

► [MEDIUM] The code explicitly checks for and handles '**proto**' to prevent prototype pollution, but it fails to account for 'constructor' or 'prototype' properties. An attacker could potentially use these to modify the prototype chain of objects.
File: dist-cjs/index.js
Evidence:
Object.prototype.hasOwnProperty.call(schemas_0, '**proto**') &&
!Object.prototype.hasOwnProperty.call(exports, '**proto**') &&
Object.defineProperty(exports, '**proto**', {
Action: Implement a comprehensive blocklist that includes 'constructor' and 'prototype' in addition to '**proto**', or use Object.create(null) to create objects without a prototype.

Assessment: The update modifies how the SDK exports modules and merges schemas/errors. While the developers recognized the risk of prototype pollution by adding a check for '**proto**', the mitigation is insufficient because it ignores other dangerous keys like 'constructor' and 'prototype'. This creates a security regression or a partial fix where the developer believes they are protected but remains vulnerable to prototype pollution via alternative vectors. The blast radius is significant as this is a core AWS SDK package used in many environments.

✅ @google-cloud/cloud-sql-connector 1.9.0 → 1.9.1 [SAFE] score: 0%
This update is a routine maintenance release that increments the package version, updates development dependencies, and bumps the @googleapis/sqladmin dependency.

► [INFO] The dependency @googleapis/sqladmin was updated from ^35.0.0 to ^35.2.0. This is a minor dependency update, which is standard for maintaining compatibility with Google Cloud APIs.
File: package.json
Evidence:
"@googleapis/sqladmin": "^35.2.0",
Action: Monitor the changelog of @googleapis/sqladmin for any breaking changes or security patches.

Assessment: The update consists primarily of version bumps for development dependencies and a minor update to the @googleapis/sqladmin dependency. The changes to sqladmin-fetcher.js are limited to updating the user-agent string to reflect the new package version, which is standard practice. No logic changes were introduced that would expose the application to prototype pollution, injection, or other common vulnerabilities. The blast radius is minimal and limited to standard library maintenance.

🟠 @shazow/whatsabi 0.25.0 → 0.26.0 [MEDIUM] score: 60%
The update introduces a fallback mechanism for environment variables that could lead to accidental exposure of the entire process.env object if misconfigured.
Static signals: env-access, sensitive-fs

► [MEDIUM] The expression `process.env.ETH_RPC_URL ?? process.env` uses the nullish coalescing operator to fallback to the entire `process.env` object if `ETH_RPC_URL` is undefined. If this object is subsequently serialized or logged, it will leak all environment variables, including sensitive keys like INFURA_API_KEY or other system secrets.
File: examples/autoload.ts
Evidence:
ETH_RPC_URL: process.env.ETH_RPC_URL ?? process.env
Action: Replace the fallback with a specific default value or an empty string, e.g., `process.env.ETH_RPC_URL ?? process.env.PROVIDER_RPC_URL ?? ''`.

Assessment: The update primarily improves provider configuration flexibility in the examples. However, the introduction of `process.env` as a fallback value in `autoload.ts` is a dangerous pattern. While this is in an 'examples' file and not the core library, it encourages insecure practices for users copying the code. The core library changes (updating @noble/hashes and fixing keccak256 input handling) appear to be legitimate maintenance and bug fixes.

✅ @types/pg 8.16.0 → 8.18.0 [SAFE] score: 0%
The update to @types/pg 8.18.0 contains no code changes as it is a type definition package.

Assessment: The package @types/pg is a TypeScript definition file for the 'pg' library. Since the provided diff is empty, there are no functional code changes, logic modifications, or security implications. As a type-only package, it does not execute code at runtime and cannot introduce vulnerabilities like prototype pollution or injection.

✅ dbmate 2.30.0 → 2.31.0 [SAFE] score: 0%
The update only increments the version numbers of optional binary dependencies, which is a standard maintenance task for this package.

Assessment: The diff is limited to updating the version strings for the @dbmate platform-specific optional dependencies in package.json. This is a standard procedure for releasing a new version of the dbmate wrapper. No application logic, security controls, or external code execution paths were modified, resulting in no new attack surface.

✅ pg 8.18.0 → 8.19.0 [SAFE] score: 0%
The update primarily introduces deprecation warnings and minor bug fixes for query callback handling and connection state management.

► [INFO] The update adds a fallback to an empty function for query callbacks when a read timeout is configured. This prevents potential crashes if a query object lacks a callback property, which is a robustness improvement rather than a security vulnerability.
File: lib/client.js
Evidence:
queryCallback = query.callback || (() => {})
Action: None required.

Assessment: The changes in pg 8.19.0 are focused on code maintenance, deprecation notices for future major versions, and minor stability improvements in query callback handling. No user-controlled input is processed in a way that introduces prototype pollution, injection, or path traversal vulnerabilities. The logic for handling query callbacks and connection state is safe and does not introduce new attack vectors.

✅ solc 0.8.33 → 0.8.34 [SAFE] score: 0%
The update consists of a version bump and a change to the minified/compiled soljson.js artifact, which is standard for solc patch releases.

Assessment: The diff shows a version increment in package.json and a modification to the soljson.js file. As solc is a compiler distributed as a pre-compiled WebAssembly/JavaScript artifact, changes to soljson.js are expected in patch releases to include compiler bug fixes or optimizations. No source code changes were provided to analyze for logic vulnerabilities, and the artifact change is consistent with the package's release lifecycle.

──────────────────────────────────────────────────────
🟠 Overall risk: MEDIUM
```
